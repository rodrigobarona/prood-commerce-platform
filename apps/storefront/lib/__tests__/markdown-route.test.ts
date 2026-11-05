import { describe, expect, it } from "vitest"
import { markdownHref, markdownPath } from "../markdown-route"

describe("markdownPath", () => {
  it("serves a page's .md URL as Markdown", () => {
    expect(markdownPath("/index.md", null)).toBe("/md")
    expect(markdownPath("/products.md", null)).toBe("/md/products")
    expect(markdownPath("/products/taca.md", null)).toBe("/md/products/taca")
    expect(markdownPath("/categories/mesa.md", null)).toBe("/md/categories/mesa")
  })

  it("serves Markdown to a client that asks for it first", () => {
    expect(markdownPath("/products/taca", "text/markdown, text/html;q=0.9")).toBe("/md/products/taca")
    expect(markdownPath("/", "text/markdown")).toBe("/md")
  })

  it("serves HTML to a browser, even one that would take Markdown", () => {
    expect(markdownPath("/products/taca", "text/html,application/xhtml+xml,*/*;q=0.8")).toBeNull()
    expect(markdownPath("/products/taca", "text/html, text/markdown")).toBeNull()
    expect(markdownPath("/products/taca", null)).toBeNull()
  })

  it("has no Markdown for pages that aren't catalog pages", () => {
    expect(markdownPath("/cart.md", null)).toBeNull()
    expect(markdownPath("/account", "text/markdown")).toBeNull()
    expect(markdownPath("/products/taca/extra.md", null)).toBeNull()
  })
})

describe("markdownHref", () => {
  it("links each page to the URL markdownPath reads back", () => {
    for (const page of ["/", "/products", "/products/taca", "/categories/mesa"]) {
      expect(markdownPath(markdownHref(page), null)).toBe(page === "/" ? "/md" : `/md${page}`)
    }
  })
})
