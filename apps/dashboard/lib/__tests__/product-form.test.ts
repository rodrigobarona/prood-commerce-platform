import { describe, expect, it } from "vitest"
import { compareAtError, priceError } from "../product-form"

describe("priceError", () => {
  it("won't put a priceless product on sale", () => {
    expect(priceError({ status: "active", price: "" })).toMatch(/price/)
    expect(priceError({ status: "active", price: "  " })).toMatch(/price/)
  })

  it.each(["0", "0.00", "-5"])("won't put a product on sale at %s", (price) => {
    expect(priceError({ status: "active", price })).toMatch(/above 0/)
  })

  it("lets a priced product go on sale, or a draft stay without a price", () => {
    expect(priceError({ status: "active", price: "0.50" })).toBeNull()
    expect(priceError({ status: "draft", price: "" })).toBeNull()
    expect(priceError({ status: "archived", price: "" })).toBeNull()
  })
})

describe("compareAtError", () => {
  it.each(["10", "9.99"])("refuses an old price of %s under a price of 10", (compareAtPrice) => {
    expect(compareAtError({ price: "10", compareAtPrice })).toMatch(/above the price/)
  })

  it("allows a real discount, or no old price", () => {
    expect(compareAtError({ price: "10", compareAtPrice: "12" })).toBeNull()
    expect(compareAtError({ price: "10", compareAtPrice: "" })).toBeNull()
  })
})
