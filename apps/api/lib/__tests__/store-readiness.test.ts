import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommerceError } from "@prood/types"

const mocks = await vi.hoisted(async () => ({
  tenantScope: new (await import("node:async_hooks")).AsyncLocalStorage<string>(),
  getStoreInfo: vi.fn(),
  listTenantPaymentProviders: vi.fn(),
  getTenantPaymentProvider: vi.fn(),
  getCart: vi.fn(),
  getDashboardStats: vi.fn(),
  getStoreSettings: vi.fn(),
  updateStoreSettings: vi.fn(),
  revalidateStore: vi.fn(),
  getStorefrontIdentity: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/server", () => ({ after: vi.fn() }))
vi.mock("@prood/platform", () => ({ getStorefrontIdentity: mocks.getStorefrontIdentity }))
vi.mock("@/lib/mailer", () => ({ getMailer: vi.fn() }))
vi.mock("@prood/commerce", () => ({
  getStoreInfo: mocks.getStoreInfo,
  listTenantPaymentProviders: mocks.listTenantPaymentProviders,
  getTenantPaymentProvider: mocks.getTenantPaymentProvider,
  getCart: mocks.getCart,
  getAdmin: async () => ({
    getDashboardStats: mocks.getDashboardStats,
    getStoreSettings: mocks.getStoreSettings,
    updateStoreSettings: mocks.updateStoreSettings,
  }),
  revalidateStore: mocks.revalidateStore,
  withTenant: (org: string, fn: () => Promise<unknown>) => mocks.tenantScope.run(org, fn),
}))

import { admin, catalog, checkout } from "../commerce-service"
import { updateStoreBody } from "../schemas"

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv("NEXT_PUBLIC_STOREFRONT_URL", "https://prood.app")
  mocks.getStoreInfo.mockResolvedValue({ name: { en: "Loja" }, contactEmail: "ola@loja.pt" })
  mocks.getDashboardStats.mockResolvedValue({ totalOrders: 0 })
  mocks.getStoreSettings.mockResolvedValue({ currency: "EUR" })
  mocks.getStorefrontIdentity.mockResolvedValue({ name: "Loja", origin: "https://loja.pt" })
})

describe("store API", () => {
  it("says the store can take orders once a payment provider is connected", async () => {
    mocks.listTenantPaymentProviders.mockResolvedValue(["easypay"])
    expect(await catalog.getStore("org-1")).toMatchObject({
      contactEmail: "ola@loja.pt",
      canTakeOrders: true,
    })
  })

  it("says it can't while none is", async () => {
    mocks.listTenantPaymentProviders.mockResolvedValue([])
    expect((await catalog.getStore("org-1")).canTakeOrders).toBe(false)
  })

  it("reads payment connections outside the tenant scope", async () => {
    mocks.listTenantPaymentProviders.mockImplementation(async () => {
      expect(mocks.tenantScope.getStore()).toBeUndefined()
      return []
    })
    await admin.dashboardStats("org-1")
    await catalog.getStore("org-1")
    expect(mocks.listTenantPaymentProviders).toHaveBeenCalledTimes(2)
  })
})

describe("admin store API", () => {
  it("adds payment readiness to the dashboard stats", async () => {
    mocks.listTenantPaymentProviders.mockResolvedValue(["stripe"])
    expect(await admin.dashboardStats("org-1")).toEqual({ totalOrders: 0, canTakeOrders: true })
  })

  it("gives the merchant their store's public address", async () => {
    expect((await admin.getStoreSettings("org-1")).url).toBe("https://loja.pt")
    expect(mocks.getStorefrontIdentity).toHaveBeenCalledWith("org-1", "https://prood.app")
  })

  it("drops the cached store info when settings change", async () => {
    mocks.updateStoreSettings.mockResolvedValue({ contactEmail: "novo@loja.pt" })
    await admin.updateStoreSettings("org-1", { contactEmail: "novo@loja.pt" })
    expect(mocks.revalidateStore).toHaveBeenCalledWith("org-1")
  })
})

describe("updating store settings", () => {
  it("accepts null to remove the contact email and description", () => {
    expect(updateStoreBody.parse({ contactEmail: null, description: null })).toEqual({
      contactEmail: null,
      description: null,
    })
  })

  it("leaves out what the request doesn't mention", () => {
    expect(updateStoreBody.parse({ country: "pt" })).toEqual({ country: "PT" })
  })

  it("still refuses an empty email", () => {
    expect(updateStoreBody.safeParse({ contactEmail: "" }).success).toBe(false)
  })
})

describe("placing an order", () => {
  beforeEach(() => {
    mocks.getCart.mockResolvedValue({ totals: { total: { amount: 24.9 } } })
  })

  it("marks a store without a provider as unavailable, not as bad input", async () => {
    mocks.getTenantPaymentProvider.mockRejectedValue(
      new CommerceError("This store has no payment provider connected yet.", "VALIDATION", 422),
    )
    await expect(checkout.assertPayable("org-1", "cart-1")).rejects.toMatchObject({
      code: "ORDERS_UNAVAILABLE",
      message: "This store has no payment provider connected yet.",
    })
  })

  it("passes through a failure that isn't about the store's setup", async () => {
    const outage = new Error("database unavailable")
    mocks.getTenantPaymentProvider.mockRejectedValue(outage)
    await expect(checkout.assertPayable("org-1", "cart-1")).rejects.toBe(outage)
  })

  it("lets a free order through without a provider", async () => {
    mocks.getCart.mockResolvedValue({ totals: { total: { amount: 0 } } })
    await checkout.assertPayable("org-1", "cart-1")
    expect(mocks.getTenantPaymentProvider).not.toHaveBeenCalled()
  })
})
