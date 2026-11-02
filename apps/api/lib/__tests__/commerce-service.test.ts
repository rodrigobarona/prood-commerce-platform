import { beforeEach, describe, expect, it, vi } from "vitest"

const commerce = vi.hoisted(() => ({
  getAdmin: vi.fn(),
  placeOrder: vi.fn(),
  revalidateProducts: vi.fn(),
  withTenant: vi.fn((_orgId: string, run: () => unknown) => run()),
}))
const send = vi.hoisted(() => vi.fn())
const after = vi.hoisted(() => vi.fn())

vi.mock("server-only", () => ({}))
vi.mock("@prood/commerce", () => commerce)
vi.mock("@prood/platform", () => ({
  getStorefrontIdentity: async () => ({ name: "Ana's Shop", origin: "https://ana.example" }),
}))
vi.mock("next/server", () => ({ after }))
vi.mock("../mailer", () => ({ getMailer: () => ({ send }) }))

import { admin, checkout } from "../commerce-service"

function order(total: number) {
  return {
    id: "order-1",
    orderNumber: "ORD-1",
    customerId: "customer-1",
    totals: { total: { amount: total, currency: "EUR" } },
  }
}

describe("checkout.placeOrder", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_URL", "https://ana.example")
    commerce.getAdmin.mockResolvedValue({
      getOrder: async () => order(0),
      getCustomer: async () => ({ authUserId: "user-1", email: "ana@example.com", firstName: "Ana", lastName: null }),
    })
  })

  it("confirms a free order by email, since no payment will", async () => {
    commerce.placeOrder.mockResolvedValue(order(0))

    await checkout.placeOrder("org-1", "cart-1", "customer-1")
    expect(after).toHaveBeenCalledOnce()
    await after.mock.calls[0]![0]()

    expect(send).toHaveBeenCalledWith(
      "email",
      expect.objectContaining({ to: "ana@example.com", template: "order-confirmation" })
    )
  })

  it("links a customer to their orders", async () => {
    commerce.placeOrder.mockResolvedValue(order(0))

    await checkout.placeOrder("org-1", "cart-1", "customer-1")
    await after.mock.calls[0]![0]()

    const { data } = send.mock.calls[0]![1]
    expect(data.orderUrl).toBe("https://ana.example/account/orders")
    expect(data.orderLabel).toBeUndefined()
  })

  it("sends a guest back to the store, since they have no orders page", async () => {
    // Checkout gives every guest a customer row, one with no login behind it.
    const guestOrder = { ...order(0), customerId: "guest-1", contactEmail: "ana@example.com" }
    commerce.placeOrder.mockResolvedValue(guestOrder)
    commerce.getAdmin.mockResolvedValue({
      getOrder: async () => guestOrder,
      getCustomer: async () => ({ authUserId: null, email: "ana@example.com", firstName: "Ana", lastName: null }),
    })

    await checkout.placeOrder("org-1", "cart-1", "guest-1", "ana@example.com")
    await after.mock.calls[0]![0]()

    expect(send).toHaveBeenCalledWith(
      "email",
      expect.objectContaining({
        to: "ana@example.com",
        data: expect.objectContaining({ orderUrl: "https://ana.example", orderLabel: "Back to the store" }),
      })
    )
  })

  it("leaves a paid order's confirmation to the payment webhook", async () => {
    commerce.placeOrder.mockResolvedValue(order(79))

    await checkout.placeOrder("org-1", "cart-1", "customer-1")

    expect(after).not.toHaveBeenCalled()
  })
})

describe("admin customers", () => {
  it("keeps the login behind a customer out of API responses", async () => {
    const row = { id: "customer-1", authUserId: "user-1", email: "ana@example.com" }
    commerce.getAdmin.mockResolvedValue({
      getCustomer: async () => row,
      listCustomers: async () => ({ items: [row], total: 1, page: 1, perPage: 20, hasMore: false }),
    })

    expect(await admin.getCustomer("org-1", "customer-1")).not.toHaveProperty("authUserId")
    const list = await admin.listCustomers("org-1", { page: 1, perPage: 20 })
    expect(list.items[0]).not.toHaveProperty("authUserId")
    expect(list.total).toBe(1)
  })
})
