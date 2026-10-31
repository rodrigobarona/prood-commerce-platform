import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  loadAndHydrate: vi.fn(),
  loadSessionOrder: vi.fn(),
  persistSession: vi.fn(),
  recordStartedPayment: vi.fn(),
  lockSession: vi.fn(),
  unlockSession: vi.fn(),
  submitPayment: vi.fn(),
}))

vi.mock("@prood/checkout-host", () => mocks)

import { POST } from "../pay/route"

const context = { params: Promise.resolve({ id: "s1" }) }

function pay(body: Record<string, unknown> = {}) {
  return POST(
    new Request("https://checkout.example/api/sessions/s1/pay", {
      method: "POST",
      body: JSON.stringify({ email: "ana@example.pt", method: "card", ...body }),
    }),
    context,
  )
}

const payment = { id: "p1", method: "card", redirectUrl: "https://pay.example/card", providerData: null }

function storedSession() {
  const session = {
    state: "failed",
    paymentSession: null as unknown,
    customerInfo: { email: "ana@example.pt" },
    submitPayment: mocks.submitPayment.mockImplementation(async () => {
      session.state = "payment"
      session.paymentSession = payment
      return payment
    }),
    updateCustomerInfo: vi.fn(),
    toSnapshot: () => ({ state: session.state, paymentSession: session.paymentSession }),
  }
  return session
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.lockSession.mockResolvedValue("token")
  mocks.unlockSession.mockResolvedValue(undefined)
  mocks.loadSessionOrder.mockResolvedValue({ status: "placed", paymentStatus: "unpaid" })
  mocks.recordStartedPayment.mockResolvedValue(undefined)
  mocks.loadAndHydrate.mockImplementation(async () => ({
    session: storedSession(),
    meta: { providerId: "stripe", methods: ["card"], customerId: "customer-1", orderId: "order-1" },
  }))
})

describe("what the browser can say", () => {
  it("passes on the method and nothing the server should decide", async () => {
    const response = await pay({
      metadata: { orderId: "someone-elses-order" },
      sourceToken: "tok_x",
      idempotencyKey: "reuse-me",
    })

    expect(response.status).toBe(200)
    expect(mocks.submitPayment).toHaveBeenCalledWith({ method: "card", customerId: "customer-1" })
  })
})

describe("two payments at once", () => {
  it("starts one payment and turns the other away", async () => {
    mocks.lockSession.mockResolvedValueOnce("token").mockResolvedValueOnce(null)

    const responses = await Promise.all([pay(), pay()])

    expect(responses.map((response) => response.status).sort()).toEqual([200, 423])
    expect(mocks.submitPayment).toHaveBeenCalledOnce()
    expect(mocks.unlockSession).toHaveBeenCalledOnce()
  })

  it("doesn't read the session without the lock, so nobody acts on a stale copy", async () => {
    mocks.lockSession.mockResolvedValue(null)

    await pay()

    expect(mocks.loadAndHydrate).not.toHaveBeenCalled()
  })

  it("releases the lock when the payment fails to start", async () => {
    mocks.loadAndHydrate.mockImplementation(async () => {
      const session = storedSession()
      session.submitPayment = vi.fn().mockRejectedValue(new Error("Gateway down"))
      return { session, meta: { providerId: "stripe", methods: ["card"] } }
    })

    const response = await pay()

    expect(response.status).toBe(500)
    expect(mocks.unlockSession).toHaveBeenCalledWith("s1", "token")
  })

  it("keeps a started payment when releasing the lock fails", async () => {
    mocks.unlockSession.mockRejectedValue(new Error("redis down"))
    const log = vi.spyOn(console, "error").mockImplementation(() => {})

    const response = await pay()

    expect(response.status).toBe(200)
    log.mockRestore()
  })
})
