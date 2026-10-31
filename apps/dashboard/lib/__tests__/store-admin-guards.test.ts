import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getActiveMemberRole: vi.fn(),
  getActiveOrganizationId: vi.fn(),
  writes: {
    upsertIntegration: vi.fn(),
    deleteIntegration: vi.fn(),
    createApiKey: vi.fn(),
    updateApiKeyRow: vi.fn(),
    createDomainRow: vi.fn(),
    deleteDomainRow: vi.fn(),
    setDomainVerified: vi.fn(),
    fulfillOrder: vi.fn(),
    refundOrder: vi.fn(),
    cancelOrder: vi.fn(),
    updateStoreSettings: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
  },
  getIntegration: vi.fn(),
  listDomains: vi.fn(),
  findDomain: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({ headers: async () => new Headers() }))
vi.mock("@/lib/auth", () => ({
  getActiveMemberRole: mocks.getActiveMemberRole,
  getActiveOrganizationId: mocks.getActiveOrganizationId,
}))
vi.mock("@/lib/auth/server", () => ({
  getAuth: () => ({ api: { createApiKey: mocks.writes.createApiKey } }),
}))
vi.mock("@/lib/auth/schema", () => ({ apikey: {}, invitation: {}, member: {} }))
vi.mock("@/lib/auth/db", () => ({
  authDb: { update: mocks.writes.updateApiKeyRow, select: vi.fn() },
}))
vi.mock("@/lib/integrations", () => ({
  getIntegration: mocks.getIntegration,
  upsertIntegration: mocks.writes.upsertIntegration,
  deleteIntegration: mocks.writes.deleteIntegration,
}))
vi.mock("@/lib/domains", () => ({
  listDomains: mocks.listDomains,
  findDomain: mocks.findDomain,
  createDomainRow: mocks.writes.createDomainRow,
  deleteDomainRow: mocks.writes.deleteDomainRow,
  setDomainDnsRecords: vi.fn(),
  setDomainVerified: mocks.writes.setDomainVerified,
}))
vi.mock("@/lib/vercel", () => ({
  ensureProjectDomain: vi.fn(),
  removeProjectDomain: vi.fn(),
  verifyProjectDomain: vi.fn(),
}))
vi.mock("@/lib/billing", () => ({ getActiveOrganizationPlan: vi.fn() }))
vi.mock("@/lib/admin-api", () => ({
  fulfillOrder: mocks.writes.fulfillOrder,
  refundOrder: mocks.writes.refundOrder,
  cancelOrder: mocks.writes.cancelOrder,
  updateStoreSettings: mocks.writes.updateStoreSettings,
  createProduct: mocks.writes.createProduct,
  updateProduct: mocks.writes.updateProduct,
  deleteProduct: mocks.writes.deleteProduct,
}))
vi.mock("@prood/billing", () => ({ getEntitlements: vi.fn() }))
vi.mock("@prood/commerce", () => ({
  assertLimit: vi.fn(),
  checkPaymentCredentials: vi.fn(),
  isPaymentProviderId: () => true,
}))
vi.mock("@prood/api-client", () => ({ isCommerceApiError: () => false }))

import { ADMIN_ONLY_MESSAGE } from "../admin"
import { listActiveOrgApiKeys } from "../api-keys"
import {
  disconnectIntegrationAction,
  saveIntegrationAction,
} from "@/app/(dashboard)/integrations/actions"
import {
  cancelOrderAction,
  fulfillOrderAction,
  refundOrderAction,
} from "@/app/(dashboard)/orders/actions"
import {
  createProductAction,
  deleteProductAction,
  updateProductAction,
} from "@/app/(dashboard)/products/actions"
import { updateStoreSettingsAction } from "@/app/(dashboard)/settings/actions"
import {
  createApiKeyAction,
  revokeApiKeyAction,
} from "@/app/(dashboard)/settings/api-keys/actions"
import { assertTeamSeatAvailableAction } from "@/app/(dashboard)/team/actions"
import {
  addDomainAction,
  removeDomainAction,
  verifyDomainAction,
} from "@/app/(dashboard)/domains/actions"

const keyForm = () => {
  const form = new FormData()
  form.set("name", "Key")
  form.set("scopes", "admin")
  form.set("id", "key-1")
  return form
}

const returnsDenial: [string, () => Promise<unknown>, unknown][] = [
  ["saveIntegrationAction", () => saveIntegrationAction("stripe", {}, true), { ok: false, error: ADMIN_ONLY_MESSAGE }],
  ["refundOrderAction", () => refundOrderAction("order-1", {}), { ok: false, error: ADMIN_ONLY_MESSAGE }],
  ["cancelOrderAction", () => cancelOrderAction("order-1"), { error: ADMIN_ONLY_MESSAGE }],
  ["updateStoreSettingsAction", () => updateStoreSettingsAction({} as never), { error: ADMIN_ONLY_MESSAGE }],
  ["createApiKeyAction", () => createApiKeyAction({}, keyForm()), { error: ADMIN_ONLY_MESSAGE }],
  ["assertTeamSeatAvailableAction", () => assertTeamSeatAvailableAction(), { error: ADMIN_ONLY_MESSAGE }],
]

const throwsDenial: [string, () => Promise<unknown>][] = [
  ["disconnectIntegrationAction", () => disconnectIntegrationAction("stripe")],
  ["fulfillOrderAction", () => fulfillOrderAction("order-1", {} as never)],
  ["createProductAction", () => createProductAction({} as never)],
  ["updateProductAction", () => updateProductAction("product-1", {} as never)],
  ["deleteProductAction", () => deleteProductAction("product-1")],
  ["revokeApiKeyAction", () => revokeApiKeyAction(keyForm())],
  ["addDomainAction", () => addDomainAction("shop.test")],
  ["verifyDomainAction", () => verifyDomainAction("domain-1")],
  ["removeDomainAction", () => removeDomainAction("domain-1")],
  ["listActiveOrgApiKeys", () => listActiveOrgApiKeys()],
]

describe.each(["member", null])("a merchant with role %s", (role) => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getActiveOrganizationId.mockResolvedValue("org-1")
    mocks.getActiveMemberRole.mockResolvedValue(role)
  })

  it.each(returnsDenial)("gets a refusal from %s", async (_name, run, expected) => {
    await expect(run()).resolves.toEqual(expected)
    for (const write of Object.values(mocks.writes)) expect(write).not.toHaveBeenCalled()
  })

  it.each(throwsDenial)("is stopped by %s", async (_name, run) => {
    await expect(run()).rejects.toThrow(ADMIN_ONLY_MESSAGE)
    for (const write of Object.values(mocks.writes)) expect(write).not.toHaveBeenCalled()
  })
})

describe("a store admin", () => {
  it.each(["owner", "admin"])("%s can disconnect a provider", async (role) => {
    vi.clearAllMocks()
    mocks.getActiveOrganizationId.mockResolvedValue("org-1")
    mocks.getActiveMemberRole.mockResolvedValue(role)

    await disconnectIntegrationAction("stripe")

    expect(mocks.writes.deleteIntegration).toHaveBeenCalledWith("org-1", "stripe")
  })
})
