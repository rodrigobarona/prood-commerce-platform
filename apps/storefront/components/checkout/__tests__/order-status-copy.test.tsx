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

  it("doesn't invent an address the store hasn't set", () => {
    expect(detail({ kind: "awaiting_payment" }, { contactEmail: null })).toBe(
      "We couldn't open payment. Your order is saved. Contact the store with order #1042.",
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
