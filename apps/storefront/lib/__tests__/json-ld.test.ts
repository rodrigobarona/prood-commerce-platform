import type { Product } from "@prood/types"
import { describe, expect, it } from "vitest"
import { breadcrumbJsonLd, jsonLdScript, productJsonLd, storeJsonLd } from "../json-ld"

const origin = "https://loja.prood.test"

const product = {
  id: "p1",
  slug: "taca",
  name: { en: "Taça" },
  description: { en: "<p>Hand-thrown <b>stoneware</b>.</p>" },
  shortDescription: null,
  sku: "TC-1",
  primaryImage: { url: "https://cdn.test/a.jpg", alt: "" },
  gallery: [{ url: "https://cdn.test/a.jpg", alt: "" }, { url: "https://cdn.test/b.jpg", alt: "" }],
  categories: [{ id: "c1", slug: "mesa", name: { en: "Mesa" } }],
  price: { amount: 24.9, currency: "EUR", formatted: "€24.90" },
  inStock: false,
  rating: { average: 4.5, count: 2 },
  variants: [],
} as unknown as Product

describe("jsonLdScript", () => {
  it("can't close the script tag it's written into", () => {
    const script = jsonLdScript({ name: "</script><script>alert(1)</script>" })
    expect(script).not.toContain("<")
    expect(JSON.parse(script)).toEqual({ name: "</script><script>alert(1)</script>" })
  })
})

describe("productJsonLd", () => {
  it("describes the product as search engines read it", () => {
    expect(productJsonLd(product, origin)).toEqual({
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Taça",
      url: `${origin}/products/taca`,
      description: "Hand-thrown stoneware.",
      image: ["https://cdn.test/a.jpg", "https://cdn.test/b.jpg"],
      sku: "TC-1",
      category: "Mesa",
      aggregateRating: { "@type": "AggregateRating", ratingValue: 4.5, reviewCount: 2 },
      offers: {
        "@type": "Offer",
        url: `${origin}/products/taca`,
        price: "24.90",
        priceCurrency: "EUR",
        availability: "https://schema.org/OutOfStock",
      },
    })
  })

  it("leaves out what the product doesn't have, rather than claiming it empty", () => {
    const bare = { ...product, description: null, sku: null, primaryImage: null, gallery: [], categories: [], price: null, rating: null }
    expect(Object.keys(productJsonLd(bare as unknown as Product, origin))).toEqual(["@context", "@type", "name", "url"])
  })
})

describe("breadcrumbJsonLd", () => {
  it("numbers the trail from the top", () => {
    expect(breadcrumbJsonLd([["Products", "/products"], ["Taça", "/products/taca"]], origin).itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Products", item: `${origin}/products` },
      { "@type": "ListItem", position: 2, name: "Taça", item: `${origin}/products/taca` },
    ])
  })
})

describe("storeJsonLd", () => {
  it("tells search engines how to search the store", () => {
    const [store, site] = storeJsonLd({ name: { en: "Casa Lume" }, description: null, logo: null, contactEmail: null }, origin)
    expect(store).toMatchObject({ "@type": "OnlineStore", name: "Casa Lume", url: origin })
    expect(site).toMatchObject({
      "@type": "WebSite",
      potentialAction: { target: { urlTemplate: `${origin}/products?q={search_term_string}` } },
    })
  })
})
