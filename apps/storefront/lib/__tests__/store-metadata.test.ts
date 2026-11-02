import { describe, expect, it } from "vitest"
import { productMetaDescription, storeMetadata } from "../store-metadata"

describe("storeMetadata", () => {
  it("uses the store's own name and description", () => {
    expect(storeMetadata({ name: { en: "Loja da Ana" }, description: { en: "Cerâmica feita à mão" } })).toEqual({
      title: { default: "Loja da Ana", template: "%s · Loja da Ana" },
      description: "Cerâmica feita à mão",
    })
  })

  it("leaves the description out when the store has none", () => {
    expect(storeMetadata({ name: { en: "Loja da Ana" }, description: null }).description).toBeUndefined()
  })
})

describe("productMetaDescription", () => {
  it("prefers the short description", () => {
    expect(productMetaDescription({ shortDescription: { en: "Curta" }, description: { en: "Longa" } })).toBe("Curta")
  })

  it("falls back to the description, as plain text", () => {
    expect(productMetaDescription({ shortDescription: null, description: { en: "<p>Taça  de grés</p>" } })).toBe(
      "Taça de grés",
    )
  })

  it("stops at what a search result can show", () => {
    expect(productMetaDescription({ shortDescription: null, description: { en: "a".repeat(400) } })).toHaveLength(160)
  })

  it("says nothing when the product has no words", () => {
    expect(productMetaDescription({ shortDescription: null, description: null })).toBeUndefined()
  })
})
