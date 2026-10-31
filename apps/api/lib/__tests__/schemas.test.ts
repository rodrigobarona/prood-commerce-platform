import { describe, expect, it } from "vitest"
import { updateProductBody, updateStoreBody } from "../schemas"

describe("updateStoreBody currency", () => {
  it("accepts a real currency in either case", () => {
    expect(updateStoreBody.parse({ currency: "EUR" }).currency).toBe("EUR")
    expect(updateStoreBody.parse({ currency: "usd" }).currency).toBe("USD")
  })

  it.each([["E1R"], ["ZZZ"], ["EURO"], ["EU"]])("refuses %s", (currency) => {
    const result = updateStoreBody.safeParse({ currency })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.message).toContain("ISO 4217")
  })

  it("leaves a code Intl.NumberFormat can format", () => {
    const { currency } = updateStoreBody.parse({ currency: "chf" })
    expect(() =>
      new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(1)
    ).not.toThrow()
  })
})

describe("product image URLs", () => {
  const accepts = (url: string) => updateProductBody.safeParse({ images: [{ url }] }).success

  it.each([
    "https://placehold.co/a.svg",
    "https://placehold.co/a%2Esvg",
    "https://placehold.co/a.svg%20",
    "https://placehold.co/a.svg/",
  ])("refuses %s", (url) => {
    expect(accepts(url)).toBe(false)
  })

  it("doesn't throw on a malformed path", () => {
    expect(accepts("https://placehold.co/a%")).toBe(true)
  })
})
