import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommerceError, type Order, type PaymentProvider } from "@prood/types"

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  recordRefund: vi.fn(),
  getTenantPaymentProvider: vi.fn(),
  after: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("@prood/platform", () => ({ getStorefrontIdentity: vi.fn() }))
vi.mock("@/lib/mailer", () => ({ getMailer: vi.fn() }))
vi.mock("@prood/commerce", () => ({
  getAdmin: async () => ({ getOrder: mocks.getOrder, recordRefund: mocks.recordRefund }),
  getTenantPaymentProvider: mocks.getTenantPaymentProvider,
  withTenant: (_org: string, fn: () => Promise<unknown>) => fn(),
}))

import { admin } from "../commerce-service"

const paid = {
  id: "order-1",
  paymentStatus: "paid",
  paymentProvider: "stripe",
  paymentTransactionId: "cs_1",
  paymentDetails: { method: "card", entity: null, reference: null, expiresAt: null },
  totals: { total: { amount: 24.9, currency: "EUR", formatted: "€24.90" } },
} as unknown as Order

function connect(overrides: Partial<PaymentProvider> = {}) {
  const provider = {
    id: "stripe",
    name: "Stripe",
    refundableMethods: ["card"],
    refund: vi.fn().mockResolvedValue({}),
  }
  mocks.getTenantPaymentProvider.mockResolvedValue({ provider: { ...provider, ...overrides } })
  return provider
}

const ifthenpay = { ...paid, paymentProvider: "ifthenpay" } as Order
const emailsQueued = () => mocks.after.mock.calls.length

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getOrder.mockResolvedValue(paid)
  mocks.recordRefund.mockResolvedValue(undefined)
})

describe("refundOrder", () => {
  it("moves the money, then records it, then tells the shopper", async () => {
    const provider = connect()
    const order: string[] = []
    provider.refund.mockImplementation(async () => {
      order.push("money")
      return {}
    })
    mocks.recordRefund.mockImplementation(async () => {
      order.push("record")
    })
    mocks.after.mockImplementation(() => order.push("email"))

    await admin.refundOrder("org", "order-1", { note: "Damaged" })

    expect(order).toEqual(["money", "record", "email"])
    expect(provider.refund).toHaveBeenCalledWith({
      sessionId: "cs_1",
      amount: 24.9,
      idempotencyKey: "refund-order-1",
    })
    expect(mocks.recordRefund).toHaveBeenCalledWith("order-1", "Damaged")
  })

  it("records nothing and emails nobody when the provider refuses", async () => {
    connect({ refund: vi.fn().mockRejectedValue(new Error("charge_already_refunded")) })

    await expect(admin.refundOrder("org", "order-1", {})).rejects.toThrow("Nothing was recorded")

    expect(mocks.recordRefund).not.toHaveBeenCalled()
    expect(emailsQueued()).toBe(0)
  })

  it("refuses an unpaid order before touching the provider", async () => {
    const provider = connect()
    mocks.getOrder.mockResolvedValue({ ...paid, paymentStatus: "unpaid" })

    await expect(admin.refundOrder("org", "order-1", {})).rejects.toThrow("Only paid orders")

    expect(provider.refund).not.toHaveBeenCalled()
    expect(mocks.recordRefund).not.toHaveBeenCalled()
  })

  it("offers the manual path where the provider can't refund, recording nothing", async () => {
    connect({ refund: undefined, refundableMethods: [] })
    mocks.getOrder.mockResolvedValue(ifthenpay)

    await expect(admin.refundOrder("org", "order-1", {})).rejects.toThrow(
      /Prood can't send this refund\. Refund €24\.90 in your payment account first/
    )

    expect(mocks.recordRefund).not.toHaveBeenCalled()
    expect(emailsQueued()).toBe(0)
  })

  it("records a refund the merchant sent, then tells the shopper", async () => {
    connect({ refund: undefined, refundableMethods: [] })
    mocks.getOrder.mockResolvedValue(ifthenpay)

    await admin.refundOrder("org", "order-1", { recordOnly: true })

    expect(mocks.recordRefund).toHaveBeenCalledOnce()
    expect(emailsQueued()).toBe(1)
  })

  it("won't record a refund Prood could have sent", async () => {
    const provider = connect()

    await expect(admin.refundOrder("org", "order-1", { recordOnly: true })).rejects.toThrow("send it instead")

    expect(provider.refund).not.toHaveBeenCalled()
    expect(mocks.recordRefund).not.toHaveBeenCalled()
  })

  it("treats a method the provider can't pay back as manual", async () => {
    const refund = vi.fn()
    connect({ refund, refundableMethods: ["mbway", "card"] })
    mocks.getOrder.mockResolvedValue({
      ...paid,
      paymentDetails: { method: "multibanco", entity: "1", reference: "2", expiresAt: null },
    })

    await expect(admin.refundOrder("org", "order-1", {})).rejects.toThrow("Prood can't send")

    expect(refund).not.toHaveBeenCalled()
  })

  it("treats a disconnected provider as manual", async () => {
    mocks.getTenantPaymentProvider.mockRejectedValue(new CommerceError("stripe is not connected", "VALIDATION", 422))

    await admin.refundOrder("org", "order-1", { recordOnly: true })

    expect(mocks.recordRefund).toHaveBeenCalledOnce()
  })

  it("warns not to resend when the money moved but recording failed", async () => {
    connect()
    mocks.recordRefund.mockRejectedValue(new Error("connection lost"))

    await expect(admin.refundOrder("org", "order-1", {})).rejects.toThrow("Don't send it again")

    expect(emailsQueued()).toBe(0)
  })
})

describe("getOrder", () => {
  it("says how a paid order can be refunded", async () => {
    connect()
    await expect(admin.getOrder("org", "order-1")).resolves.toMatchObject({ refund: "provider" })
  })

  it("offers no refund on an unpaid order", async () => {
    mocks.getOrder.mockResolvedValue({ ...paid, paymentStatus: "unpaid" })
    await expect(admin.getOrder("org", "order-1")).resolves.toMatchObject({ refund: null })
  })

  it("offers the manual path for a provider without refunds", async () => {
    connect({ refund: undefined, refundableMethods: [] })
    await expect(admin.getOrder("org", "order-1")).resolves.toMatchObject({ refund: "manual" })
  })
})
