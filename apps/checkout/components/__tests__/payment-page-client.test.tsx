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

describe("coming back from a hosted card page", () => {
  const started = {
    ...session,
    state: "payment",
    paymentSession: {
      id: "p1",
      status: "requires_action",
      method: "card",
      redirectUrl: "https://pay.example/card",
      providerData: { requestId: "r1" },
      createdAt: new Date().toISOString(),
    },
  }

  it("offers the payment page again", async () => {
    stubFetch({ "/api/sessions/s1": () => json(started) })
    await open()

    expect(screen.getByRole("link", { name: "Continue to the payment page" }).getAttribute("href")).toBe(
      "https://pay.example/card",
    )
  })

  it("says so when Pay comes back with nothing to do", async () => {
    const stuck = { ...started, paymentSession: { ...started.paymentSession, redirectUrl: null } }
    const fetch = stubFetch({
      "/api/sessions/s1": () => json(stuck),
      "/pay": () => json({ ...stuck, redirectUrl: null }),
    })
    await open()

    await act(async () => {
      fireEvent.click(pay())
    })

    expect(fetch).toHaveBeenCalledTimes(2)
    expect(screen.getByRole("alert").textContent).toContain("We couldn't continue this payment")
  })

  it("moves on to a reference Pay comes back with", async () => {
    stubFetch({
      "/api/sessions/s1": () => json({ ...session, state: "failed" }),
      "/pay": () =>
        json({
          state: "payment",
          redirectUrl: null,
          paymentSession: {
            id: "p2",
            status: "pending",
            method: "multibanco",
            providerData: { entity: "11111", reference: "123456789" },
            createdAt: new Date().toISOString(),
          },
        }),
    })
    await open()

    await act(async () => {
      fireEvent.click(pay())
    })

    expect(screen.queryByRole("alert")).toBeNull()
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull()
    expect(screen.getByText(/123\s?456\s?789/)).toBeTruthy()
  })
})

describe("when the provider holds the money", () => {
  it("says the payment is pending instead of offering Stripe's form again", async () => {
    stubFetch({
      "/api/sessions/s1": () =>
        json({
          ...session,
          state: "pending",
          payable: false,
          publishableKey: "pk_test",
          paymentSession: {
            id: "cs_1",
            status: "authorized",
            method: "card",
            providerData: { clientSecret: "secret" },
            createdAt: new Date().toISOString(),
          },
        }),
    })
    await open()

    expect(screen.getByText("Payment pending")).toBeTruthy()
    expect(screen.queryByText("Stripe form")).toBeNull()
    expect(screen.queryByRole("button", { name: /^Pay / })).toBeNull()
  })
})

describe("when another tab is already starting the payment", () => {
  it("says so instead of a failed payment", async () => {
    stubFetch({
      "/api/sessions/s1": () => json({ ...session, state: "failed" }),
      "/pay": () => json({ code: "VALIDATION", message: "busy" }, 423),
    })
    await open()

    await act(async () => {
      fireEvent.click(pay())
    })

    expect(screen.getByRole("alert").textContent).toContain("already starting")
    expect(pay()).toBeTruthy()
  })
})
