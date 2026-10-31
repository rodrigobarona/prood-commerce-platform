import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PaymentPageClient } from "../payment-page-client"

vi.mock("../stripe-payment", () => ({ StripePayment: () => <p>Stripe form</p> }))

const session = {
  sessionId: "s1",
  providerId: "easypay",
  kind: "pl",
  state: "info",
  payable: true,
  methods: ["card", "mbway"],
  amount: 24.9,
  currency: "EUR",
  orderId: "order-1",
  expiresAt: null,
  returnUrl: "https://store.example/order-confirmation",
  customerInfo: { email: "ana@example.pt", phone: "912345678" },
  paymentSession: null,
}

const startedMbWay = {
  ...session,
  state: "payment",
  paymentSession: {
    id: "p1",
    status: "pending",
    method: "mbway",
    providerData: null,
    createdAt: new Date().toISOString(),
  },
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function stubFetch(routes: Record<string, () => Response>) {
  const fn = vi.fn(async (url: string) => {
    const route = Object.keys(routes).find((path) => url.endsWith(path))
    if (!route) throw new Error(`Unexpected request to ${url}`)
    return routes[route]!()
  })
  vi.stubGlobal("fetch", fn)
  return fn
}

async function open() {
  render(<PaymentPageClient sessionId="s1" />)
  await act(async () => {})
}

const pay = () => screen.getByRole("button", { name: /^Pay / })

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("when the order stops waiting for payment", () => {
  it("shows the way out instead of Try again once MB WAY fails for good", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] })
    stubFetch({
      "/api/sessions/s1": () => json(startedMbWay),
      "/confirm": () => json({ state: "failed", payable: false }),
    })
    await open()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(screen.getByText("This order can't be paid")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull()
    expect(screen.getByRole("link", { name: "Back to the store" }).getAttribute("href")).toBe(
      "https://store.example/order-confirmation?orderId=order-1",
    )
  })

  it("still offers a retry when MB WAY fails and the order can be paid", async () => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] })
    stubFetch({
      "/api/sessions/s1": () => json(startedMbWay),
      "/confirm": () => json({ state: "failed", payable: true }),
    })
    await open()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4000)
    })

    expect(pay()).toBeTruthy()
    expect(screen.getByText(/Your last payment didn't go through/)).toBeTruthy()
  })

  it("shows the way out when Pay finds the order is closed", async () => {
    stubFetch({
      "/api/sessions/s1": () => json({ ...session, state: "failed" }),
      "/pay": () => json({ code: "VALIDATION", message: "closed" }, 409),
    })
    await open()

    await act(async () => {
      fireEvent.click(pay())
    })

    expect(screen.getByText("This order can't be paid")).toBeTruthy()
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull()
  })
})
