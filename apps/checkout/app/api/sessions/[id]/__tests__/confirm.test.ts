import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  loadAndHydrate: vi.fn(),
  loadSessionOrder: vi.fn(),
  persistSession: vi.fn(),
  confirmPayment: vi.fn(),
}))

vi.mock("@prood/checkout-host", () => ({
  loadAndHydrate: mocks.loadAndHydrate,
  loadSessionOrder: mocks.loadSessionOrder,
  persistSession: mocks.persistSession,
  syncSessionWithOrder: vi.fn(),
}))

import { POST } from "../confirm/route"

const context = { params: Promise.resolve({ id: "s1" }) }
const request = new Request("https://checkout.example/api/sessions/s1/confirm", { method: "POST" })

beforeEach(() => {
  vi.resetAllMocks()
  mocks.persistSession.mockImplementation(async (_id, session) => ({
    state: session.state,
    orderId: "order-1",
  }))
})

function load(session: Record<string, unknown>) {
  mocks.loadAndHydrate.mockResolvedValue({
    session: { confirmPayment: mocks.confirmPayment, ...session },
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
})
