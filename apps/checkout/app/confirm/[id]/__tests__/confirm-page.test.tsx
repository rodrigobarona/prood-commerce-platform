import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import type { StoreHint } from "@prood/checkout-host"
import { afterEach, describe, expect, it, vi } from "vitest"
import { CheckoutContextProvider, useCheckoutContext } from "@/components/checkout-context"
import { ConfirmClient } from "../confirm-client"

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function StoreName() {
  return <p data-testid="store">{useCheckoutContext().storeName}</p>
}

async function open(session: Response) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.includes("/confirm")
        ? json({ state: "complete", payable: false, returnUrl: "https://store.example/order", orderId: "o1" })
        : session,
    ),
  )
  render(
    <CheckoutContextProvider>
      <StoreName />
      <ConfirmClient sessionId="s1" declined={false} />
    </CheckoutContextProvider>,
  )
  await act(async () => {})
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("the confirmation page", () => {
  it("keeps the store's name and shows the receipt", async () => {
    await open(
      json({
        storeName: "Loja da Ana",
        amount: 66,
        currency: "EUR",
        order: { number: "1042", contactEmail: "ana@example.pt", emailed: true, items: [], shipping: null },
      }),
    )
    expect(screen.getByTestId("store").textContent).toBe("Loja da Ana")
    expect(screen.getByText("Order #1042")).toBeTruthy()
    expect(screen.getByText("€66.00")).toBeTruthy()
    expect(screen.getByRole("link", { name: "View your order" }).getAttribute("href")).toContain("store.example")
  })

  describe("when the payment can't be checked", () => {
    const session = { storeName: "Loja da Ana", storeEmail: "ola@lojadaana.pt", returnUrl: "https://store.example/order", amount: 66, currency: "EUR" }

    /** Each call answers from a list, so a test can change the outcome between attempts. */
    async function openUnknown(sessionResponses: (() => Response)[], hint: StoreHint | null = null) {
      const confirm = vi.fn(async () => json({}, 500))
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) => (url.includes("/confirm") ? confirm() : (sessionResponses.shift() ?? (() => json({}, 500)))())),
      )
      render(
        <CheckoutContextProvider>
          <StoreName />
          <ConfirmClient sessionId="s1" declined={false} hint={hint} />
        </CheckoutContextProvider>,
      )
      await act(async () => {})
      return confirm
    }

    it("keeps the store in view and offers a way on", async () => {
      await openUnknown([() => json(session)])
      expect(screen.getByRole("heading", { name: "Your payment can't be checked right now" })).toBeTruthy()
      expect(screen.getByTestId("store").textContent).toBe("Loja da Ana")
      expect(screen.getByRole("link", { name: "Back to the store" }).getAttribute("href")).toContain("store.example")
      expect(screen.getByRole("link", { name: "ola@lojadaana.pt" }).getAttribute("href")).toBe("mailto:ola@lojadaana.pt")
    })

    it("checks again when asked", async () => {
      const confirm = await openUnknown([() => json(session), () => json(session)])
      confirm.mockResolvedValueOnce(json({ state: "complete", payable: false, returnUrl: null, orderId: "o1" }))
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Check again" }))
      })
      expect(screen.getByText("Payment confirmed")).toBeTruthy()
    })

    it("falls back on the link's store details when the session can't be read", async () => {
      await openUnknown([], {
        name: "Loja da Ana",
        email: "ola@lojadaana.pt",
        home: "https://store.example",
      })
      expect(screen.getByTestId("store").textContent).toBe("Loja da Ana")
      expect(screen.getByRole("link", { name: "ola@lojadaana.pt" })).toBeTruthy()
      expect(screen.getByRole("link", { name: "Back to the store" }).getAttribute("href")).toBe("https://store.example")
    })

    it("gives the order number only when the session vouches for it", async () => {
      await openUnknown([() => json({ ...session, order: { number: "1042", contactEmail: null, emailed: true, items: [], shipping: null } })])
      expect(screen.getByText(/Your order is #1042/)).toBeTruthy()
    })

    it("says who's talking, and where to look next", async () => {
      await openUnknown([])
      expect(screen.getByText(/This payment page can't read its records right now/)).toBeTruthy()
      expect(screen.queryByText(/on our side/)).toBeNull()
    })

    it("still offers a way on with nothing known", async () => {
      await openUnknown([])
      expect(screen.getByRole("button", { name: "Check again" })).toBeTruthy()
      expect(screen.getByText("Find your order email.")).toBeTruthy()
      expect(screen.queryByText(/Contact the store/)).toBeNull()
      expect(screen.queryByRole("link", { name: "Back to the store" })).toBeNull()
    })
  })

  describe("while a payment isn't finished", () => {
    const session = {
      storeName: "Loja da Ana",
      amount: 66,
      currency: "EUR",
      order: { number: "1042", contactEmail: null, emailed: true, items: [], shipping: null },
    }

    async function openState(state: string, payable: boolean) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url.includes("/confirm")
            ? json({ state, payable, returnUrl: null, orderId: "o1" })
            : json(session),
        ),
      )
      render(
        <CheckoutContextProvider>
          <ConfirmClient sessionId="s1" declined={false} />
        </CheckoutContextProvider>,
      )
      await act(async () => {})
    }

    it("shows the order and the amount on a failed payment", async () => {
      await openState("failed", true)
      expect(screen.getByText("Payment not completed")).toBeTruthy()
      expect(screen.getByText("Order #1042")).toBeTruthy()
      expect(screen.getByText("Amount")).toBeTruthy()
      expect(screen.getByText("€66.00")).toBeTruthy()
      expect(screen.queryByText("Amount paid")).toBeNull()
    })

    it("shows the order and the amount on a pending payment", async () => {
      await openState("pending", false)
      expect(screen.getByText("Payment pending")).toBeTruthy()
      expect(screen.getByText("Order #1042")).toBeTruthy()
      expect(screen.getByText("Amount")).toBeTruthy()
      expect(screen.getByText("€66.00")).toBeTruthy()
      expect(screen.queryByText("Amount paid")).toBeNull()
    })

    it("links to the order when it knows the way", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url.includes("/confirm")
            ? json({ state: "pending", payable: false, returnUrl: "https://loja.example/order-confirmation?orderId=o1", orderId: "o1" })
            : json(session),
        ),
      )
      render(
        <CheckoutContextProvider>
          <ConfirmClient sessionId="s1" declined={false} />
        </CheckoutContextProvider>,
      )
      await act(async () => {})
      expect(screen.getByRole("link", { name: "View your order" }).getAttribute("href")).toContain("orderId=o1")
    })

    it("doesn't promise the order when only the store's front door is known", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url.includes("/confirm")
            ? json({ state: "pending", payable: false, returnUrl: null, orderId: "o1" })
            : json({}, 500),
        ),
      )
      render(
        <CheckoutContextProvider>
          <ConfirmClient
            sessionId="s1"
            declined={false}
            hint={{ name: "Loja da Ana", email: null, home: "https://loja.example" }}
          />
        </CheckoutContextProvider>,
      )
      await act(async () => {})
      expect(screen.queryByRole("link", { name: "View your order" })).toBeNull()
      expect(screen.getByRole("link", { name: "Back to the store" }).getAttribute("href")).toBe("https://loja.example")
    })

    it("names the store when it has listed no address", async () => {
      await openState("pending", false)
      expect(screen.getByText("Need help? Contact Loja da Ana.")).toBeTruthy()
    })
  })

  describe("when a confirmed payment has no way back to the store", () => {
    const session = {
      amount: 66,
      currency: "EUR",
      order: { number: "1042", contactEmail: null, emailed: true, items: [], shipping: null },
    }

    async function openConfirmed(details: Record<string, unknown>) {
      vi.stubGlobal(
        "fetch",
        vi.fn(async (url: string) =>
          url.includes("/confirm")
            ? json({ state: "complete", payable: false, returnUrl: null, orderId: "o1" })
            : json({ ...session, ...details }),
        ),
      )
      render(
        <CheckoutContextProvider>
          <ConfirmClient sessionId="s1" declined={false} />
        </CheckoutContextProvider>,
      )
      await act(async () => {})
    }

    it("offers the store's address instead", async () => {
      await openConfirmed({ storeEmail: "ola@lojadaana.pt" })
      expect(screen.getByRole("link", { name: "Email the store" }).getAttribute("href")).toBe(
        "mailto:ola@lojadaana.pt?subject=Order%20%231042",
      )
    })

    it("still says where to turn with no address either", async () => {
      await openConfirmed({ storeName: "Loja da Ana" })
      expect(screen.queryByRole("link")).toBeNull()
      expect(screen.getByText("Need help? Contact Loja da Ana.")).toBeTruthy()
    })
  })

  it("still confirms when the session can't be read", async () => {
    await open(json({}, 500))
    expect(screen.getByText("Payment confirmed")).toBeTruthy()
    expect(screen.queryByText("Amount paid")).toBeNull()
  })
})
