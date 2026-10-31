import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  loadAndHydrate: vi.fn(),
  loadSession: vi.fn(),
  loadSessionOrder: vi.fn(),
  lockSession: vi.fn(),
  unlockSession: vi.fn(),
  persistSession: vi.fn(),
  confirmPayment: vi.fn(),
  abandonPayment: vi.fn(),
}))

vi.mock("@prood/checkout-host", () => ({
  loadAndHydrate: mocks.loadAndHydrate,
  loadSession: mocks.loadSession,
  loadSessionOrder: mocks.loadSessionOrder,
  lockSession: mocks.lockSession,
  unlockSession: mocks.unlockSession,
  persistSession: mocks.persistSession,
  syncSessionWithOrder: vi.fn(),
}))

import { POST } from "../confirm/route"

const context = { params: Promise.resolve({ id: "s1" }) }
const request = new Request("https://checkout.example/api/sessions/s1/confirm", { method: "POST" })

beforeEach(() => {
  vi.resetAllMocks()
  mocks.lockSession.mockResolvedValue("token")
  mocks.unlockSession.mockResolvedValue(undefined)
  mocks.persistSession.mockImplementation(async (_id, session) => ({
    state: session.state,
    orderId: "order-1",
  }))
})

function load(session: Record<string, unknown>) {
  mocks.loadAndHydrate.mockResolvedValue({
    session: { confirmPayment: mocks.confirmPayment, abandonPayment: mocks.abandonPayment, ...session },
    meta: { providerId: "stripe", returnUrl: null },
  })
}

describe("confirm", () => {
  it("leaves a session alone and reports pending while funds are authorized", async () => {
    load({ state: "payment" })
    mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "authorized" })

    const response = await POST(request, context)

    expect(await response.json()).toMatchObject({ state: "pending", payable: false })
    expect(mocks.confirmPayment).not.toHaveBeenCalled()
  })

  it("asks the provider while the order is still open", async () => {
    load({ state: "payment" })
    mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "unpaid" })

    await POST(request, context)

    expect(mocks.confirmPayment).toHaveBeenCalledOnce()
  })

  it("releases the lock when it's done", async () => {
    load({ state: "payment" })
    mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "unpaid" })

    await POST(request, context)

    expect(mocks.unlockSession).toHaveBeenCalledWith("s1", "token")
  })

  it("only reads while /pay holds the lock, so it can't undo what /pay saves", async () => {
    mocks.lockSession.mockResolvedValue(null)
    mocks.loadSession.mockResolvedValue({
      snapshot: { state: "payment", orderId: "order-1" },
      meta: { providerId: "stripe", returnUrl: null },
    })
    mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "unpaid" })

    const response = await POST(request, context)

    expect(await response.json()).toMatchObject({ state: "payment", payable: true })
    expect(mocks.loadAndHydrate).not.toHaveBeenCalled()
    expect(mocks.persistSession).not.toHaveBeenCalled()
    expect(mocks.unlockSession).not.toHaveBeenCalled()
  })

  describe("after a hosted card page declines", () => {
    const declined = new Request("https://checkout.example/api/sessions/s1/confirm?payment=failed", {
      method: "POST",
    })

    it("ends the attempt, so the shopper can try again", async () => {
      load({
        state: "payment",
        paymentSession: { method: "card", redirectUrl: "https://pay.example/card" },
      })
      mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "unpaid" })

      await POST(declined, context)

      expect(mocks.abandonPayment).toHaveBeenCalledOnce()
      expect(mocks.confirmPayment).not.toHaveBeenCalled()
    })

    it("ignores the flag on a Multibanco reference, which can still be paid", async () => {
      load({ state: "payment", paymentSession: { method: "multibanco", redirectUrl: null } })
      mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "unpaid" })

      await POST(declined, context)

      expect(mocks.abandonPayment).not.toHaveBeenCalled()
    })

    it("doesn't undo a payment the order already has", async () => {
      load({
        state: "payment",
        paymentSession: { method: "card", redirectUrl: "https://pay.example/card" },
      })
      mocks.loadSessionOrder.mockResolvedValue({ status: "approved", paymentStatus: "paid" })

      await POST(declined, context)

      expect(mocks.abandonPayment).not.toHaveBeenCalled()
    })
  })
})
