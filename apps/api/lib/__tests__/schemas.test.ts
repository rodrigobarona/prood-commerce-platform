import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { adminListOrdersQuery, updateProductBody, updateStoreBody } from "../schemas"

describe("updateStoreBody region", () => {
  const accepts = (input: Record<string, string>) => updateStoreBody.safeParse(input).success

  it("takes a real language, timezone and country", () => {
    expect(accepts({ locale: "pt", timezone: "Europe/Lisbon", country: "PT" })).toBe(true)
    expect(accepts({ timezone: "UTC" })).toBe(true)
    expect(updateStoreBody.parse({ country: "es" }).country).toBe("ES")
  })

  it.each([
    [{ locale: "banana" }],
    [{ timezone: "banana" }],
    [{ country: "banana" }],
    [{ country: "XQ" }],
    [{ country: "ZZ" }],
  ])("refuses %j", (input) => {
    expect(accepts(input)).toBe(false)
  })
})

describe("adminListOrdersQuery queue", () => {
  it.each(["open", "to_fulfill"])("takes %s", (queue) => {
    expect(adminListOrdersQuery.parse({ queue }).queue).toBe(queue)
  })

  it("refuses anything else", () => {
    expect(adminListOrdersQuery.safeParse({ queue: "banana" }).success).toBe(false)
  })
})

describe("updateStoreBody contact", () => {
  it("takes a phone number as people write them, and removing one", () => {
    expect(updateStoreBody.safeParse({ contactPhone: "+351 912 345 678" }).success).toBe(true)
    expect(updateStoreBody.safeParse({ contactPhone: null }).success).toBe(true)
  })

  it.each(["call me", "123"])("refuses %s as a phone number", (contactPhone) => {
    expect(updateStoreBody.safeParse({ contactPhone }).success).toBe(false)
  })

  it("explains a bad email in plain words", () => {
    const result = updateStoreBody.safeParse({ contactEmail: "a@b" })
    expect(result.error?.issues[0]?.message).toMatch(/^We can't use that email\./)
  })
})

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
  const media = "https://media.example.test"
  const accepts = (url: string) => updateProductBody.safeParse({ images: [{ url }] }).success

  beforeEach(() => vi.stubEnv("S3_PUBLIC_URL", media))
  afterEach(() => vi.unstubAllEnvs())

  it("accepts an image uploaded to the store's bucket", () => {
    expect(accepts(`${media}/a.jpg`)).toBe(true)
  })

  it.each([
    `${media}/a.svg`,
    `${media}/a%2Esvg`,
    `${media}/a.svg%20`,
    `${media}/a.svg/`,
    "https://placehold.co/a.jpg",
  ])("refuses %s", (url) => {
    expect(accepts(url)).toBe(false)
  })

  it("doesn't throw on a malformed path", () => {
    expect(accepts(`${media}/a%`)).toBe(true)
  })
})
