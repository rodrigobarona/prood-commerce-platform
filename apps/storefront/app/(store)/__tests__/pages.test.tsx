import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchProductList: vi.fn(),
  fetchCategories: vi.fn(),
  fetchStoreInfo: vi.fn(),
  fetchProductBySlug: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }))
vi.mock("@/lib/commerce-data", () => mocks)
vi.mock("@/components/commerce/connected-product-grid", async () => {
  const { ProductGrid } = await import("@prood/ui/components/product-grid")
  return { ConnectedProductGrid: ProductGrid }
})
vi.mock("@/components/commerce/product-purchase", () => ({ ProductPurchase: () => null }))

import CategoryPage from "../categories/[slug]/page"
import ErrorPage from "../error"
import HomePage from "../page"
import ProductDetailPage from "../products/[slug]/page"
import ProductsPage from "../products/page"

const store = { name: { en: "Loja da Ana" }, description: { en: "Cerâmica" } }
const noProducts = { products: { items: [], total: 0 } }
const outage = new Error("connect ECONNREFUSED 10.0.0.4:5432")

const products = (sp: Record<string, string> = {}) =>
  ProductsPage({ searchParams: Promise.resolve(sp) })

beforeEach(() => {
  mocks.fetchProductList.mockResolvedValue(noProducts)
  mocks.fetchCategories.mockResolvedValue([])
  mocks.fetchStoreInfo.mockResolvedValue(store)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("catalog failures", () => {
  it("reach the error page instead of reading as an empty store", async () => {
    mocks.fetchProductList.mockRejectedValue(outage)
    await expect(HomePage()).rejects.toBe(outage)
    await expect(products()).rejects.toBe(outage)
  })

  it("reach it when the home page can't read the store", async () => {
    mocks.fetchStoreInfo.mockRejectedValue(outage)
    await expect(HomePage()).rejects.toBe(outage)
  })

  it("aren't reported as a missing category", async () => {
    mocks.fetchCategories.mockRejectedValue(outage)
    await expect(CategoryPage({ params: Promise.resolve({ slug: "tacas" }) })).rejects.toBe(outage)
  })

  it("aren't reported as a missing product", async () => {
    mocks.fetchProductBySlug.mockRejectedValue(outage)
    await expect(ProductDetailPage({ params: Promise.resolve({ slug: "taca" }) })).rejects.toBe(outage)
    expect(mocks.notFound).not.toHaveBeenCalled()
  })
})

describe("an empty store", () => {
  const COPY = "This store is adding products. Check back soon."

  it("says so on the home page, under the store's own name", async () => {
    const { container } = render(await HomePage())
    expect(container.textContent).toContain(COPY)
    expect(container.textContent).toContain("Welcome to Loja da Ana")
    expect(container.textContent).toContain("Cerâmica")
    expect(container.textContent).not.toContain("exclusive offers")
  })

  it("says so on the products page", async () => {
    const { container } = render(await products())
    expect(container.textContent).toContain(COPY)
  })

  it("doesn't say so for a search with no matches", async () => {
    const { container } = render(await products({ q: "boots" }))
    expect(container.textContent).not.toContain(COPY)
    expect(container.textContent).toContain("Check the spelling")
  })
})

describe("the products page", () => {
  it.each(["-1", "0", "1.5", "abc", "", "1e400"])("reads page=%s as page 1", async (page) => {
    await products({ page })
    expect(mocks.fetchProductList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
  })

  it("keeps a real page number", async () => {
    await products({ page: "3" })
    expect(mocks.fetchProductList).toHaveBeenLastCalledWith(expect.objectContaining({ page: 3 }))
  })
})

describe("a page past the end of the products", () => {
  it("links back to the first page of the same search", async () => {
    mocks.fetchProductList.mockResolvedValue({ products: { items: [], total: 30 } })
    render(await products({ q: "taça", page: "9" }))
    expect(screen.getByText("No more products")).toBeTruthy()
    expect(screen.getByRole("link", { name: "Go to page 1" }).getAttribute("href")).toBe(
      "/products?q=ta%C3%A7a&page=1",
    )
  })
})

describe("the error page", () => {
  it("shows shoppers a calm sentence, not the raw error", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const { container } = render(<ErrorPage error={outage} retry={vi.fn()} />)
    expect(container.textContent).toContain("We couldn't load this page. Try again in a moment.")
    expect(container.textContent).not.toContain("ECONNREFUSED")
  })

  it("fetches the page again on retry", () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const retry = vi.fn()
    render(<ErrorPage error={outage} retry={retry} />)
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(retry).toHaveBeenCalledOnce()
  })
})
