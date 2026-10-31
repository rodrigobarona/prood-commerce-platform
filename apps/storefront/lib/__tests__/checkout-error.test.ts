import { describe, expect, it } from "vitest"
import { checkoutErrorMessage } from "../checkout-error"

const GENERIC = "We couldn't start checkout. Try again in a moment."

describe("checkoutErrorMessage", () => {
  it.each([
    "This store has no payment provider connected yet.",
    "Monthly order limit reached for your plan. Upgrade to accept more orders.",
  ])("keeps a merchant-facing message from shoppers: %s", (message) => {
    const shown = checkoutErrorMessage({ code: "ORDERS_UNAVAILABLE", message })
    expect(shown).toBe(
      "This store isn't taking orders right now. Your cart is saved, so try again later.",
    )
  })

  it("passes on what the shopper can act on", () => {
    expect(checkoutErrorMessage({ code: "VALIDATION", message: "Only 2 left in stock" })).toBe(
      "Only 2 left in stock",
    )
  })

  it("never shows a thrown error", () => {
    expect(checkoutErrorMessage(new Error("CHECKOUT_API_SECRET is required"))).toBe(GENERIC)
  })

  it("never shows a driver error that looks like an API error", () => {
    const driverError = Object.assign(new Error("connection terminated"), { code: "57P01" })
    expect(checkoutErrorMessage(driverError)).toBe(GENERIC)
  })
})
