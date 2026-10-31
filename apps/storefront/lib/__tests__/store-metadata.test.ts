import { describe, expect, it } from "vitest"
import { storeMetadata } from "../store-metadata"

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
