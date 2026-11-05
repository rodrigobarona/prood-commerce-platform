import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getProducts: vi.fn(), getCategories: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/catalog", () => ({ getProducts: mocks.getProducts, getCategories: mocks.getCategories }))
vi.mock("@/lib/store-host", () => ({ storeOrigin: (host: string) => `https://${host}` }))

import { sitemapEntries, sitemapFile, sitemapIndex } from "../sitemap"

const host = "loja.prood.test"

/** A store of `total` products, answering pages the way the API does. */
function storeOf(total: number) {
  mocks.getProducts.mockImplementation(async (_host: string, { page = 1, perPage }: { page?: number; perPage: number }) => {
    const start = (page - 1) * perPage
    const count = Math.max(0, Math.min(perPage, total - start))
    return {
      products: {
        total,
        items: Array.from({ length: count }, (_, i) => ({ slug: `p${start + i + 1}`, updatedAt: "2026-11-01", primaryImage: null })),
      },
    }
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("sitemapIndex", () => {
  it("lists the store's pages, then one file per 500 products", async () => {
    storeOf(1001)
    const body = await (await sitemapIndex(host)).text()
    expect(body.match(/<loc>[^<]+<\/loc>/g)).toEqual([
      `<loc>https://${host}/sitemap/pages.xml</loc>`,
      `<loc>https://${host}/sitemap/products-1.xml</loc>`,
      `<loc>https://${host}/sitemap/products-2.xml</loc>`,
      `<loc>https://${host}/sitemap/products-3.xml</loc>`,
    ])
  })
})

describe("sitemapEntries", () => {
  it("asks the API only for the pages a small store has", async () => {
    storeOf(30)
    const entries = await sitemapEntries(host, "products-1.xml")
    expect(entries).toHaveLength(30)
    expect(mocks.getProducts).toHaveBeenCalledTimes(1)
  })

  it("reads the right slice of a big store", async () => {
    storeOf(1001)
    const entries = await sitemapEntries(host, "products-2.xml")
    expect(entries).toHaveLength(500)
    expect(entries?.[0]?.path).toBe("/products/p501")
    expect(mocks.getProducts).toHaveBeenCalledTimes(5)
  })

  it("has no file past the last product, or with a name it didn't give out", async () => {
    storeOf(30)
    expect(await sitemapEntries(host, "products-2.xml")).toBeNull()
    expect(await sitemapEntries(host, "products-0.xml")).toBeNull()
    expect(await sitemapEntries(host, "other.xml")).toBeNull()
  })

  it("lists the home page, the catalog and each category", async () => {
    mocks.getCategories.mockResolvedValue([{ slug: "mesa" }])
    expect(await sitemapEntries(host, "pages.xml")).toEqual([{ path: "/" }, { path: "/products" }, { path: "/categories/mesa" }])
  })
})

describe("sitemapFile", () => {
  it("escapes what it writes into the XML", async () => {
    const body = await sitemapFile(host, [{ path: "/products/a&b", image: "https://cdn.test/x.jpg?w=1&h=2" }]).text()
    expect(body).toContain(`<loc>https://${host}/products/a&#38;b</loc>`)
    expect(body).toContain("<image:loc>https://cdn.test/x.jpg?w=1&#38;h=2</image:loc>")
  })
})
