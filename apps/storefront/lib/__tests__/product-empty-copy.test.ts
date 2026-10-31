import { describe, expect, it } from "vitest"
import { productListEmptyCopy } from "../product-empty-copy"

const FIRST_PAGE = "/products?page=1"
const copy = (view: Omit<Parameters<typeof productListEmptyCopy>[0], "firstPageHref">) =>
  productListEmptyCopy({ ...view, firstPageHref: FIRST_PAGE })

describe("productListEmptyCopy", () => {
  it("leaves an empty store to the grid's own state", () => {
    expect(copy({ total: 0 })).toBeUndefined()
  })

  it("doesn't call a failed search an empty store", () => {
    expect(copy({ query: "boots", total: 0 })?.emptyTitle).toBe('No results for "boots"')
  })

  it("doesn't call a page past the end an empty store", () => {
    expect(copy({ total: 30 })?.emptyTitle).toBe("No more products")
  })

  it("doesn't call a page past the end of a search a failed search", () => {
    expect(copy({ query: "boots", total: 30 })?.emptyTitle).toBe("No more products")
  })

  it("links back from a page past the end", () => {
    expect(copy({ categoryId: "c1", total: 30 })).toMatchObject({
      emptyActionLabel: "Go to page 1",
      emptyActionHref: FIRST_PAGE,
    })
  })

  it("has nowhere to send a view with no products", () => {
    expect(copy({ query: "boots", total: 0 })).not.toHaveProperty("emptyActionHref")
  })

  it("doesn't call an empty category an empty store", () => {
    expect(copy({ categoryId: "c1", total: 0 })?.emptyTitle).toBe(
      "No products in this category yet",
    )
  })
})
