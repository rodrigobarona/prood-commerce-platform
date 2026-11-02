import { describe, expect, it } from "vitest"
import { priceNote } from "../price-note"

const price = { amount: 29, currency: "EUR", formatted: "" }

describe("priceNote", () => {
  it("says VAT is included and what shipping starts at", () => {
    expect(priceNote({ vatIncluded: true, vatRate: 23, requiresShipping: true, price })).toBe(
      "VAT included. Shipping from €15.00.",
    )
  })

  it("says when VAT isn't in the price", () => {
    expect(priceNote({ vatIncluded: false, vatRate: 23, requiresShipping: true, price })).toBe(
      "VAT not included. Shipping from €15.00.",
    )
  })

  it("doesn't mention shipping for something that doesn't ship", () => {
    expect(priceNote({ vatIncluded: true, vatRate: 23, requiresShipping: false, price })).toBe("VAT included.")
  })

  it("claims nothing about VAT when no rate was set", () => {
    expect(priceNote({ vatIncluded: true, vatRate: null, requiresShipping: true, price })).toBe("Shipping from €15.00.")
    expect(priceNote({ vatIncluded: true, vatRate: null, requiresShipping: false, price })).toBe("")
  })
})
