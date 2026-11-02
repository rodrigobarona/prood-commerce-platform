import { describe, expect, it } from "vitest"
import type { Cart } from "@prood/types"
import { cartSaving, paymentNote, shippingFrom } from "@prood/ui/lib/commerce"

const price = (amount: number, originalAmount?: number) => ({ amount, originalAmount, currency: "EUR", formatted: "" })

describe("paymentNote", () => {
  it("names what the provider offers, in its order", () => {
    expect(paymentNote(["multibanco", "mbway", "card"])).toBe("Pay by Multibanco, MB WAY or card.")
    expect(paymentNote(["card"])).toBe("Pay by card.")
  })

  it("says nothing when it isn't known", () => {
    expect(paymentNote([])).toBeNull()
  })
})

describe("shippingFrom", () => {
  it("is the cheapest fixed rate", () => {
    expect(shippingFrom("EUR")).toBe("€15.00")
  })
})

describe("cartSaving", () => {
  const cart = (items: unknown[]) => ({ items, totals: { total: price(0) } }) as unknown as Pick<Cart, "items" | "totals">

  it("adds up the discount across quantities", () => {
    expect(cartSaving(cart([{ price: price(29, 39), quantity: 2 }, { price: price(22), quantity: 1 }]))).toBe("You saved €20.00")
  })

  it("stays quiet without one", () => {
    expect(cartSaving(cart([{ price: price(22), quantity: 1 }]))).toBeNull()
  })
})
