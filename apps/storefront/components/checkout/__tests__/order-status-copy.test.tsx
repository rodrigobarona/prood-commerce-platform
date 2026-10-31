import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import type { OrderPaymentState } from "@prood/types"
import { orderStatusCopy } from "../order-status-copy"

type Context = Parameters<typeof orderStatusCopy>[1]

const context: Context = { couldNotOpenPayment: true, orderNumber: "1042", contactEmail: "ola@lojadaana.pt" }

function detail(state: OrderPaymentState, overrides: Partial<Context> = {}) {
  const { container } = render(<>{orderStatusCopy(state, { ...context, ...overrides }).detail}</>)
  return container.textContent
}

afterEach(cleanup)

describe("orderStatusCopy", () => {
  it("gives a shopper whose payment didn't open the real address and order number", () => {
    expect(detail({ kind: "awaiting_payment" })).toBe(
      "We couldn't open payment. Your order is saved. Email ola@lojadaana.pt with order #1042.",
    )
    expect(screen.getByRole("link", { name: "ola@lojadaana.pt" }).getAttribute("href")).toBe(
      "mailto:ola@lojadaana.pt?subject=Order%20%231042",
    )
  })

  describe("for a store with no contact email", () => {
    const noEmail = { contactEmail: null }

    it("gives the shopper their order number without sending them to contact anyone", () => {
      expect(detail({ kind: "awaiting_payment" }, noEmail)).toBe(
        "We couldn't open payment. Your order #1042 is saved and the store can see it, but it hasn't listed a contact email. Keep this number.",
      )
    })

    it("offers a new order after a failed payment", () => {
      expect(detail({ kind: "failed" }, noEmail)).toBe(
        "The payment didn't go through, so you haven't been charged. To get these items, place a new order.",
      )
    })

    it("says there's no address after a refund", () => {
      expect(detail({ kind: "refunded" }, noEmail)).toBe("This store hasn't listed a contact email.")
    })

    it.each([{ kind: "awaiting_payment" }, { kind: "failed" }, { kind: "refunded" }] as const)(
      "never says to contact the store on $kind",
      (state) => {
        expect(detail(state, noEmail)).not.toMatch(/contact the store/i)
      },
    )
  })

  it("keeps the waiting copy when payment did open", () => {
    expect(detail({ kind: "awaiting_payment" }, { couldNotOpenPayment: false })).toBe(
      "We're waiting for your payment. We'll email you when it arrives.",
    )
  })

  it("offers the address on a failed payment too", () => {
    expect(detail({ kind: "failed" })).toContain("Email ola@lojadaana.pt if you still want these items.")
  })
})
