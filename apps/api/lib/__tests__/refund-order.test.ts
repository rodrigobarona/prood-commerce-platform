import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommerceError, type Order, type PaymentProvider } from "@prood/types"

const mocks = vi.hoisted(() => ({
  getOrder: vi.fn(),
  recordRefund: vi.fn(),
  getTenantPaymentProvider: vi.fn(),
  verifyPaymentWebhook: vi.fn(),
  applyPaymentEvent: vi.fn(),
  after: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("@prood/platform", () => ({ getStorefrontIdentity: vi.fn() }))
vi.mock("@/lib/mailer", () => ({ getMailer: vi.fn() }))
vi.mock("@prood/commerce", () => ({
  getAdmin: async () => ({ getOrder: mocks.getOrder, recordRefund: mocks.recordRefund }),
  getAdapter: async () => ({ applyPaymentEvent: mocks.applyPaymentEvent }),
  getTenantPaymentProvider: mocks.getTenantPaymentProvider,
  verifyPaymentWebhook: mocks.verifyPaymentWebhook,
  revalidateProducts: vi.fn(),
  withTenant: (_org: string, fn: () => Promise<unknown>) => fn(),
}))

import { admin, webhooks } from "../commerce-service"

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
    refund: vi.fn().mockResolvedValue(undefined),
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

  it("records a refund made in the provider's own dashboard, moving no money", async () => {
    const provider = connect()

    await admin.refundOrder("org", "order-1", { recordOnly: true, note: "Sent from Stripe" })

    expect(provider.refund).not.toHaveBeenCalled()
    expect(mocks.recordRefund).toHaveBeenCalledWith("order-1", "Sent from Stripe")
    expect(emailsQueued()).toBe(1)
  })

  it("doesn't claim money moved when only recording a refund fails", async () => {
    connect()
    mocks.recordRefund.mockRejectedValue(new Error("connection lost"))

    await expect(admin.refundOrder("org", "order-1", { recordOnly: true })).rejects.toThrow("connection lost")
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

describe("refundOrder racing the provider's webhook", () => {
  it("succeeds without a second email when the webhook recorded the refund first", async () => {
    connect()
    mocks.recordRefund.mockRejectedValue(new CommerceError("Only paid orders can be refunded.", "VALIDATION", 422))
    mocks.getOrder.mockResolvedValueOnce(paid).mockResolvedValueOnce({ ...paid, paymentStatus: "refunded" })

    await expect(admin.refundOrder("org", "order-1", {})).resolves.toBeUndefined()

    expect(emailsQueued()).toBe(0)
  })
})

describe("reconcilePayment", () => {
  const event = {
    type: "payment.refunded",
    sessionId: "cs_1",
    orderId: "order-1",
    amount: 24.9,
    currency: "EUR",
    data: {},
  }
  const reconcile = () => webhooks.reconcilePayment("stripe", "{}", "sig", "org")

  beforeEach(() => {
    mocks.verifyPaymentWebhook.mockResolvedValue(event)
    mocks.applyPaymentEvent.mockResolvedValue("applied")
  })

  it("applies a provider refund and emails the shopper", async () => {
    await expect(reconcile()).resolves.toBe("applied")

    expect(mocks.applyPaymentEvent).toHaveBeenCalledWith("order-1", {
      outcome: "refunded",
      amount: 24.9,
      currency: "EUR",
      provider: "stripe",
      transactionId: "cs_1",
    })
    expect(emailsQueued()).toBe(1)
  })

  it("emails nobody when the refund was already recorded", async () => {
    mocks.applyPaymentEvent.mockResolvedValue("duplicate")

    await expect(reconcile()).resolves.toBe("duplicate")

    expect(emailsQueued()).toBe(0)
  })

  it("doesn't email about a refund of a payment the order doesn't use", async () => {
    mocks.applyPaymentEvent.mockResolvedValue("stale")

    await expect(reconcile()).resolves.toBe("stale")

    expect(emailsQueued()).toBe(0)
  })

  it("records a partial refund without telling the shopper the order was refunded", async () => {
    mocks.verifyPaymentWebhook.mockResolvedValue({ ...event, type: "payment.partially_refunded", amount: 5 })

    await expect(reconcile()).resolves.toBe("applied")

    expect(mocks.applyPaymentEvent).toHaveBeenCalledWith("order-1", expect.objectContaining({ outcome: "partially_refunded" }))
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
