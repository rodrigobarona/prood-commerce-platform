import { describe, expect, it } from "vitest"
import { updateStoreBody } from "../schemas"

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
