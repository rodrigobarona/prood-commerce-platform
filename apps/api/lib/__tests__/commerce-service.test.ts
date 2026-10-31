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

import { checkout } from "../commerce-service"

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
      getCustomer: async () => ({ email: "ana@example.com", firstName: "Ana", lastName: null }),
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

  it("leaves a paid order's confirmation to the payment webhook", async () => {
    commerce.placeOrder.mockResolvedValue(order(79))

    await checkout.placeOrder("org-1", "cart-1", "customer-1")

    expect(after).not.toHaveBeenCalled()
  })
})
