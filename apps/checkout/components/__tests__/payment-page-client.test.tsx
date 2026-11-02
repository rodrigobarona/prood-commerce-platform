import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { PaymentPageClient } from "../payment-page-client"

vi.mock("../stripe-payment", () => ({
  StripePayment: ({ onChooseAnother }: { onChooseAnother?: () => void }) => (
    <div>
      <p>Stripe form</p>
      {onChooseAnother ? (
        <button type="button" onClick={onChooseAnother}>
          Choose another way to pay
        </button>
      ) : null}
    </div>
  ),
}))

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

describe("when the payment can't be read", () => {
  it("says who's talking, and where to look when nothing is known", async () => {
    stubFetch({ "/api/sessions/s1": () => json({}, 500) })
    await open()

    expect(screen.getByRole("heading", { name: "This payment can't be loaded right now" })).toBeTruthy()
    expect(screen.getByText(/This payment page can't read its records right now/)).toBeTruthy()
    expect(screen.getByText("Find your order email.")).toBeTruthy()
  })

  it("names the store its link vouches for", async () => {
    stubFetch({ "/api/sessions/s1": () => json({}, 500) })
    render(<PaymentPageClient sessionId="s1" hint={{ name: "Loja da Ana", email: null, home: "https://store.example" }} />)
    await act(async () => {})

    expect(screen.getByText("Need help? Contact Loja da Ana.")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Back to the store" }).getAttribute("href")).toBe("https://store.example")
  })
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
    expect(screen.getByText("Save these details. We won't email them.")).toBeTruthy()
    expect(screen.getByRole("link", { name: "View your order" }).getAttribute("href")).toBe("/confirm/s1")
    expect(screen.queryByText(/completed payment/)).toBeNull()
  })
})

describe("where focus goes when Pay can't go ahead", () => {
  it("moves to the error when the call fails", async () => {
    stubFetch({
      "/api/sessions/s1": () => json({ ...session, state: "failed" }),
      "/pay": () => json({}, 423),
    })
    await open()
    await act(async () => {
      fireEvent.click(pay())
    })
    expect(document.activeElement).toBe(screen.getByRole("alert"))
  })

  it("moves to the field for a bad phone number, however many tries", async () => {
    stubFetch({ "/api/sessions/s1": () => json({ ...session, methods: ["mbway"] }) })
    await open()
    const phone = screen.getByLabelText("MB WAY phone number") as HTMLInputElement
    fireEvent.change(phone, { target: { value: "123" } })
    for (let attempt = 0; attempt < 2; attempt += 1) {
      pay().focus()
      await act(async () => {
        fireEvent.click(pay())
      })
      expect(document.activeElement).toBe(phone)
    }
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
    expect(screen.getByRole("link", { name: "View your order" }).getAttribute("href")).toContain("orderId=order-1")
    expect(screen.queryByText("Amount paid")).toBeNull()
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

describe("the way back to the store", () => {
  it("leads to the store's front door, not the order it came from", async () => {
    stubFetch({ "/api/sessions/s1": () => json({ ...session, storeName: "Loja da Ana" }) })
    await open()
    expect(screen.getByRole("link", { name: "Back to Loja da Ana" }).getAttribute("href")).toBe("https://store.example")
  })

  it("isn't offered for a link that came from nowhere", async () => {
    stubFetch({ "/api/sessions/s1": () => json({ ...session, returnUrl: null }) })
    await open()
    expect(screen.queryByRole("link", { name: /Back to/ })).toBeNull()
  })
})

describe("what's being paid for", () => {
  it("lists the order under the amount", async () => {
    const order = {
      number: "1042",
      items: [{ id: "i1", name: "Taça", variantName: "Azul", quantity: 2, amount: 9.9 }],
      shipping: 15,
    }
    stubFetch({ "/api/sessions/s1": () => json({ ...session, order }) })
    await open()
    expect(screen.getByRole("region", { name: "Order #1042" }).textContent).toContain("Taça · Azul × 2")
    expect(screen.getByRole("region", { name: "Order #1042" }).textContent).toContain("Shipping")
  })
})

describe("a finished payment", () => {
  it("shows the receipt and where the confirmation went", async () => {
    const order = { number: "1042", contactEmail: "ana@example.pt", emailed: true, items: [], shipping: null }
    stubFetch({ "/api/sessions/s1": () => json({ ...session, state: "complete", order }) })
    await open()
    expect(screen.getByText("Order #1042")).toBeTruthy()
    expect(screen.getByText("€24.90")).toBeTruthy()
    expect(screen.getByText("We'll email your order confirmation to ana@example.pt.")).toBeTruthy()
  })

  it("promises no email without an order behind it", async () => {
    stubFetch({ "/api/sessions/s1": () => json({ ...session, state: "complete", order: null }) })
    await open()
    expect(screen.queryByText(/We'll email/)).toBeNull()
  })

  it("offers the store's address when there's no way back to it", async () => {
    stubFetch({
      "/api/sessions/s1": () =>
        json({ ...session, state: "complete", returnUrl: null, storeEmail: "ola@lojadaana.pt", order: null }),
    })
    await open()
    expect(screen.getByRole("link", { name: "Email the store" }).getAttribute("href")).toBe("mailto:ola@lojadaana.pt")
  })

  it("still says where to turn with no address either", async () => {
    stubFetch({
      "/api/sessions/s1": () =>
        json({ ...session, state: "complete", returnUrl: null, storeEmail: null, storeName: "Loja da Ana", order: null }),
    })
    await open()
    expect(screen.getByText("Need help? Contact Loja da Ana.")).toBeTruthy()
  })
})

describe("MB WAY", () => {
  it("ties a wrong number's error to the field", async () => {
    stubFetch({ "/api/sessions/s1": () => json({ ...session, methods: ["mbway"] }) })
    await open()
    fireEvent.change(screen.getByLabelText("MB WAY phone number"), { target: { value: "123" } })
    fireEvent.click(pay())
    expect(screen.getByLabelText("MB WAY phone number").getAttribute("aria-describedby")).toBe(
      screen.getByRole("alert").id,
    )
  })

  it("moves focus to the wait, and says what to do if the number was wrong", async () => {
    const started = {
      ...startedMbWay,
      paymentSession: { ...startedMbWay.paymentSession, id: "p2" },
    }
    stubFetch({
      "/api/sessions/s1": () => json({ ...session, methods: ["mbway"] }),
      "/pay": () => json(started),
    })
    await open()
    await act(async () => {
      fireEvent.click(pay())
    })
    expect(document.activeElement?.textContent).toBe("Approve the payment in MB WAY")
    expect(screen.getByText(/Wait for this one to expire/)).toBeTruthy()
  })

  it("keeps MB WAY chosen after a timeout, so the number can be corrected", async () => {
    const expired = {
      ...startedMbWay,
      methods: ["card", "mbway"],
      paymentSession: { ...startedMbWay.paymentSession, createdAt: new Date(0).toISOString() },
    }
    stubFetch({ "/api/sessions/s1": () => json(expired) })
    await open()
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10))
    })
    expect((screen.getByLabelText("MB WAY phone number") as HTMLInputElement).value).toBe("912345678")
    expect(screen.getByText(/The MB WAY request expired/)).toBeTruthy()
  })
})

describe("when the card form can't load", () => {
  const startedCard = {
    ...session,
    state: "payment",
    publishableKey: "pk_test",
    methods: ["card", "multibanco"],
    paymentSession: {
      id: "p1",
      status: "pending",
      method: "card",
      providerData: { clientSecret: "secret" },
      createdAt: new Date().toISOString(),
    },
  }

  it("has no other way to offer a session with only cards", async () => {
    stubFetch({ "/api/sessions/s1": () => json({ ...startedCard, methods: ["card"] }) })
    await open()
    expect(screen.queryByRole("button", { name: "Choose another way to pay" })).toBeNull()
  })

  it("goes back to the other methods when the session has them", async () => {
    stubFetch({ "/api/sessions/s1": () => json(startedCard) })
    await open()
    fireEvent.click(screen.getByRole("button", { name: "Choose another way to pay" }))
    expect(screen.getByRole("radio", { name: /Multibanco/ })).toBeTruthy()
    expect(screen.queryByRole("radio", { name: /Card/ })).toBeNull()
  })

  it("says so when the started card payment can't be swapped", async () => {
    stubFetch({
      "/api/sessions/s1": () => json(startedCard),
      "/pay": () => json(startedCard),
    })
    await open()
    fireEvent.click(screen.getByRole("button", { name: "Choose another way to pay" }))
    await act(async () => {
      fireEvent.click(pay())
    })
    expect(screen.getByRole("alert").textContent).toContain("We couldn't change how this order is paid.")
  })
})
