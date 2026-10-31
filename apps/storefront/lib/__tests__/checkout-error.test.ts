import { describe, expect, it } from "vitest"
import { checkoutErrorMessage } from "../checkout-error"

const GENERIC = "We couldn't complete that. Try again in a moment."

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

  it.each([
    { code: "UNKNOWN", message: "Internal server error" },
    { code: "CONFIGURATION_ERROR", message: "DATABASE_URL is not set" },
    { code: "PLATFORM_ERROR", message: "upstream returned 502" },
    { code: "SOMETHING_NEW", message: "Not meant for shoppers" },
  ])("never shows the message of a plain $code body", (body) => {
    expect(checkoutErrorMessage(body)).toBe(GENERIC)
  })

  it("explains a request that failed schema validation", () => {
    const shown = checkoutErrorMessage({
      code: "VALIDATION",
      message: "Validation failed",
      errors: [{ path: "street", message: "Too small" }],
    })
    expect(shown).toBe("Some of your details look wrong. Check them and try again.")
  })

  it("has its own copy for a cart that's gone and for too many attempts", () => {
    expect(checkoutErrorMessage({ code: "NOT_FOUND", message: "Cart c1 not found" })).toBe(
      "We couldn't find your cart. Add your items again to check out.",
    )
    expect(checkoutErrorMessage({ code: "RATE_LIMIT", message: "429" })).toBe(
      "That was a lot of attempts. Wait a moment and try again.",
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
