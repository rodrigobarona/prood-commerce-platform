import { describe, expect, it } from "vitest"
import type { ProductVariant } from "@prood/types"
import { variantLabel } from "../variant-label"

const variants = (...names: string[]) => names.map((en) => ({ name: { en } })) as unknown as ProductVariant[]

describe("variantLabel", () => {
  it("calls sizes sizes", () => {
    expect(variantLabel(variants("Small", "Medium", "Large"))).toBe("Size")
    expect(variantLabel(variants("S", "M", "XL"))).toBe("Size")
    expect(variantLabel(variants("250 ml", "500 ml"))).toBe("Size")
  })

  it("won't guess at anything else", () => {
    expect(variantLabel(variants("Indigo", "Sand"))).toBe("Options")
    expect(variantLabel(variants("Small", "Blue"))).toBe("Options")
    expect(variantLabel([])).toBe("Options")
  })
})
