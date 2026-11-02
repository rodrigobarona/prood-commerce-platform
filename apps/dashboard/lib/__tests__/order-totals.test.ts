import { describe, expect, it } from "vitest"
import { taxLine } from "../order-totals"

const price = (amount: number) => ({ amount, currency: "EUR", formatted: "" })
const totals = (subtotal: number, shipping: number, discount: number, tax: number, total: number) => ({
  subtotal: price(subtotal),
  shipping: price(shipping),
  discount: price(discount),
  tax: price(tax),
  total: price(total),
})

describe("taxLine", () => {
  it("treats VAT already in the prices as included", () => {
    expect(taxLine(totals(369, 0, 0, 69, 369))).toEqual({ added: false })
    expect(taxLine(totals(54, 4.9, 0, 11.01, 58.9))).toEqual({ added: false })
    expect(taxLine(totals(100, 5, 10, 18, 95))).toEqual({ added: false })
  })

  it("keeps tax as a line when it was added on top", () => {
    expect(taxLine(totals(100, 0, 0, 23, 123))).toEqual({ added: true })
  })

  it("shows nothing for an order with no tax", () => {
    expect(taxLine(totals(10, 0, 0, 0, 10))).toBeNull()
    expect(taxLine({ ...totals(10, 0, 0, 0, 10), tax: null })).toBeNull()
  })
})
