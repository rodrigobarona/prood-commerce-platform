import type { Category, Product, StorefrontStore } from "@prood/types"
import { describe, expect, it } from "vitest"
import { htmlToText, llmsTxt, productMarkdown } from "../markdown"

const origin = "https://loja.prood.test"

describe("htmlToText", () => {
  it("keeps the merchant's paragraphs and lists, and nothing that runs", () => {
    expect(htmlToText("<p>Hand-thrown &amp; glazed.</p><ul><li>Oven safe</li><li>Dishwasher safe</li></ul><script>x</script>")).toBe(
      "Hand-thrown & glazed.\n\n- Oven safe\n\n- Dishwasher safe\n\nx",
    )
  })
})

describe("productMarkdown", () => {
  const product = {
    slug: "taca",
    name: { en: "Taça [grande]" },
    shortDescription: { en: "A wide bowl." },
    description: { en: "<p>Hand-thrown.</p>" },
    sku: "TC-1",
    price: { amount: 24.9, currency: "EUR", formatted: "€24.90" },
    vatIncluded: true,
    inStock: true,
    categories: [{ slug: "mesa", name: { en: "Mesa" } }],
    rating: null,
    variants: [],
    attributes: [],
    primaryImage: null,
  } as unknown as Product

  it("gives an agent the facts it needs to recommend the product, with a link to buy it", () => {
    const markdown = productMarkdown(product, origin)
    expect(markdown).toMatch(/^# Taça \[grande\]\n/)
    expect(markdown).toContain("- Availability: in stock")
    expect(markdown).toContain("- SKU: TC-1")
    expect(markdown).toContain(`- Category: [Mesa](${origin}/categories/mesa.md)`)
    expect(markdown).toContain("Hand-thrown.")
    expect(markdown.trimEnd().endsWith(`Buy it at ${origin}/products/taca`)).toBe(true)
  })
})

describe("llmsTxt", () => {
  const store = { name: { en: "Casa Lume" }, description: { en: "<p>Ceramics from Lisbon.</p>" }, contactEmail: "ola@casalume.test" } as unknown as StorefrontStore
  const categories = [{ slug: "mesa", name: { en: "Mesa" }, description: null }] as unknown as Category[]

  it("names the store and points at its readable pages", () => {
    const text = llmsTxt({ store, categories, origin, docsUrl: "https://docs.prood.test" })
    expect(text).toMatch(/^# Casa Lume\n\n> Ceramics from Lisbon\.\n/)
    expect(text).toContain(`- [All products](${origin}/products.md)`)
    expect(text).toContain(`- [Mesa](${origin}/categories/mesa.md)`)
    expect(text).toContain(`- [Home](${origin}/index.md)`)
    expect(text).toContain("- Contact: ola@casalume.test")
    expect(text).toContain("https://docs.prood.test/llms.txt")
  })

  it("leaves out the docs when there are none to link", () => {
    expect(llmsTxt({ store, categories, origin })).not.toContain("## Optional")
  })
})
