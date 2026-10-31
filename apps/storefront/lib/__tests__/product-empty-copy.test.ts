import { describe, expect, it } from "vitest"
import { productListEmptyCopy } from "../product-empty-copy"

describe("productListEmptyCopy", () => {
  it("leaves an empty store to the grid's own state", () => {
    expect(productListEmptyCopy({ total: 0 })).toBeUndefined()
  })

  it("doesn't call a failed search an empty store", () => {
    expect(productListEmptyCopy({ query: "boots", total: 0 })?.emptyTitle).toBe('No results for "boots"')
  })

  it("doesn't call a page past the end an empty store", () => {
    expect(productListEmptyCopy({ total: 30 })?.emptyTitle).toBe("No more products")
  })

  it("doesn't call an empty category an empty store", () => {
    expect(productListEmptyCopy({ categoryId: "c1", total: 0 })?.emptyTitle).toBe(
      "No products in this category yet",
    )
  })
})
