import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  fetchProductList: vi.fn(),
  fetchCategories: vi.fn(),
  fetchStoreInfo: vi.fn(),
  fetchProductBySlug: vi.fn(),
  resolveTenantId: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("@/lib/store-host", () => ({ storeOrigin: (host: string) => `https://${host}` }))
vi.mock("next/navigation", () => ({ notFound: mocks.notFound }))
vi.mock("next/root-params", () => ({ host: async () => "loja.prood.test" }))
vi.mock("@/lib/commerce-data", () => mocks)
vi.mock("@/lib/tenant", () => ({ resolveTenantId: mocks.resolveTenantId }))
vi.mock("@prood/platform", () => ({ DEMO_ORG_ID: "org_demo" }))
vi.mock("@prood/media/image", () => ({
  MediaImage: ({ slug }: { slug: string }) => <span data-media={slug} />,
}))
vi.mock("@/components/commerce/connected-product-grid", async () => {
  const { ProductGrid } = await import("@prood/ui/components/product-grid")
  return { ConnectedProductGrid: ProductGrid }
})
vi.mock("@/components/commerce/product-purchase", () => ({ ProductPurchase: () => null }))
vi.mock("@/components/commerce/sort-select", () => ({ SortSelect: () => null }))

import { CategoryPageContent, ProductsPageContent } from "@/components/commerce/collection-page"
import { ProductPageContent } from "@/components/commerce/product-page"
import ErrorPage from "../error"
import HomePage from "../page"

const store = { name: { en: "Loja da Ana" }, description: { en: "Cerâmica" } }
const noProducts = { products: { items: [], total: 0 } }
const outage = new Error("connect ECONNREFUSED 10.0.0.4:5432")

const products = (sp: Record<string, string> = {}) =>
  ProductsPageContent({ searchParams: Promise.resolve(sp) })

beforeEach(() => {
  mocks.fetchProductList.mockResolvedValue(noProducts)
  mocks.fetchCategories.mockResolvedValue([])
  mocks.fetchStoreInfo.mockResolvedValue(store)
  mocks.resolveTenantId.mockResolvedValue("org_ana")
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
    await expect(CategoryPageContent({ slug: Promise.resolve("tacas"), searchParams: Promise.resolve({}) })).rejects.toBe(outage)
  })

  it("aren't reported as a missing product", async () => {
    mocks.fetchProductBySlug.mockRejectedValue(outage)
    await expect(ProductPageContent({ slug: Promise.resolve("taca") })).rejects.toBe(outage)
    expect(mocks.notFound).not.toHaveBeenCalled()
  })
})

const COPY = "This store is adding products. Check back soon."

describe("an empty store", () => {
  it("says so on the home page, under the store's own words", async () => {
    const { container } = render(await HomePage())
    expect(container.textContent).toContain(COPY)
    expect(screen.getByRole("heading", { level: 1, name: "Loja da Ana" })).toBeTruthy()
    expect(container.textContent).toContain("Cerâmica")
    expect(container.textContent).not.toContain("exclusive offers")
  })

  it("keeps the store's name for screen readers, not a second time on screen, when it wrote nothing", async () => {
    mocks.fetchStoreInfo.mockResolvedValue({ ...store, description: null })
    const { container } = render(await HomePage())
    const heading = screen.getByRole("heading", { level: 1, name: "Loja da Ana" })
    expect(heading.className).toContain("sr-only")
    expect(container.querySelector("section.bg-muted")).toBeNull()
  })

  const stocked = (count: number) => ({
    products: {
      items: Array.from({ length: count }, (_, i) => ({
        id: `p${i}`,
        slug: `taca-${i}`,
        name: { en: `Taça ${i}` },
        primaryImage: null,
        gallery: [],
        price: null,
        variants: [],
        inStock: true,
        rating: null,
        productType: "physical",
      })),
      total: count,
    },
  })

  it.each([
    [1, "lg:grid-cols-3"],
    [3, "lg:grid-cols-3"],
    [4, "lg:grid-cols-4"],
  ])("sizes %i photographed products to fill the row", async (count, columns) => {
    const list = stocked(count)
    const photo = { url: "https://cdn.example/taca.jpg", alt: "Taça" }
    mocks.fetchProductList.mockResolvedValue({
      products: { ...list.products, items: list.products.items.map((item) => ({ ...item, primaryImage: photo })) },
    })
    const { container } = render(await HomePage())
    expect(container.querySelector(".grid")?.className).toContain(columns)
  })

  it("keeps a few products with no photos small, on short tiles", async () => {
    mocks.fetchProductList.mockResolvedValue(stocked(2))
    const { container } = render(await HomePage())
    expect(container.querySelector(".grid")?.className).toContain("lg:grid-cols-4")
    expect(container.querySelector(".grid a")?.className).toContain("aspect-[3/2]")
  })

  it("doesn't call anything featured", async () => {
    const product = { id: "p1", slug: "taca", name: { en: "Taça" }, primaryImage: null, gallery: [], price: null, variants: [], inStock: true, rating: null, productType: "physical" }
    mocks.fetchProductList.mockResolvedValue({ products: { items: [product], total: 1 } })
    render(await HomePage())
    expect(screen.getByRole("heading", { level: 2, name: "Latest products" })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "Featured products" })).toBeNull()
  })

  it("names its one category instead", async () => {
    const product = { id: "p1", slug: "taca", name: { en: "Taça" }, primaryImage: null, gallery: [], price: null, variants: [], inStock: true, rating: null, productType: "physical" }
    mocks.fetchProductList.mockResolvedValue({ products: { items: [product], total: 1 } })
    mocks.fetchCategories.mockResolvedValue([{ id: "c1", slug: "mesa", name: { en: "Mesa" }, image: null }])
    render(await HomePage())
    expect(screen.getByRole("heading", { level: 2, name: "Mesa" })).toBeTruthy()
    expect(screen.getByRole("heading", { level: 2, name: "Browse by category" })).toBeTruthy()
  })
})

describe("the home page's photographs", () => {
  const withPhoto = {
    id: "p1",
    slug: "taca",
    name: { en: "Taça" },
    primaryImage: { url: "https://cdn.example/taca.jpg", alt: "Taça" },
    gallery: [],
    price: null,
    variants: [],
    inStock: true,
    rating: null,
    productType: "physical",
  }

  it("never reach a real store from the demo's art", async () => {
    mocks.fetchStoreInfo.mockResolvedValue({ name: { en: "Casa Exemplo" }, description: { en: "Loja" } })
    const { container } = render(await HomePage())
    expect(container.querySelector("[data-media]")).toBeNull()
  })

  it("dress the seeded demo store", async () => {
    mocks.resolveTenantId.mockResolvedValue("org_demo")
    const { container } = render(await HomePage())
    expect(container.querySelectorAll("[data-media]")).toHaveLength(2)
  })

  it("don't show a product twice on the demo store", async () => {
    mocks.resolveTenantId.mockResolvedValue("org_demo")
    mocks.fetchCategories.mockResolvedValue([{ id: "c1", slug: "linen", name: { en: "Linen" }, image: null }])
    mocks.fetchProductList.mockResolvedValue({ products: { items: [withPhoto], total: 1 } })
    render(await HomePage())
    expect(screen.getByRole("link", { name: /Linen/ }).querySelector("img")?.getAttribute("src")).toContain(
      "product-linen",
    )
  })

  it("come from the store's own products otherwise", async () => {
    mocks.fetchProductList.mockResolvedValue({ products: { items: [withPhoto], total: 1 } })
    render(await HomePage())
    expect(screen.getAllByRole("img", { name: "Taça" })[0]?.getAttribute("src")).toContain("taca.jpg")
  })

  it("lead with the store's own words on the hero", async () => {
    mocks.fetchProductList.mockResolvedValue({ products: { items: [withPhoto], total: 1 } })
    render(await HomePage())
    expect(screen.getByRole("heading", { level: 1, name: "Cerâmica" })).toBeTruthy()
    expect(screen.getByRole("link", { name: "Browse products" })).toBeTruthy()
    expect(screen.getByRole("heading", { level: 2, name: "Latest from Loja da Ana" })).toBeTruthy()
  })

  it("keep a long description out of the hero's display line", async () => {
    const description = "Cerâmica feita à mão numa pequena oficina, peça a peça, para a mesa de todos os dias e dias de festa."
    mocks.fetchStoreInfo.mockResolvedValue({ ...store, description: { en: description } })
    mocks.fetchProductList.mockResolvedValue({ products: { items: [withPhoto], total: 1 } })
    const { container } = render(await HomePage())
    expect(screen.getByRole("heading", { level: 1, name: "Loja da Ana" })).toBeTruthy()
    expect(container.textContent).toContain(description)
  })

  it("give the demo's second grid a heading of its own", async () => {
    mocks.resolveTenantId.mockResolvedValue("org_demo")
    const items = Array.from({ length: 6 }, (_, index) => ({ ...withPhoto, id: `p${index}`, slug: `p${index}` }))
    mocks.fetchProductList.mockResolvedValue({ products: { items, total: 6 } })
    render(await HomePage())
    expect(screen.getByRole("heading", { level: 2, name: "More from the shelves" })).toBeTruthy()
  })
})

describe("an empty products page", () => {
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
