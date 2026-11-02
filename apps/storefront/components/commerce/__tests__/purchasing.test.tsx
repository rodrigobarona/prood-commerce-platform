import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Product } from "@prood/types"

const mocks = vi.hoisted(() => ({
  cart: { canTakeOrders: true, loading: false, addItem: vi.fn(), addProduct: vi.fn() },
}))

vi.mock("@/components/providers/cart-provider", () => ({ useCart: () => mocks.cart }))

import { AddToCart } from "../add-to-cart"
import { ConnectedProductGrid } from "../connected-product-grid"

const product = {
  id: "p1",
  slug: "taca",
  name: { en: "Taça" },
  inStock: true,
  variants: [],
  gallery: [],
  primaryImage: null,
  price: { amount: 24.9, currency: "EUR", formatted: "€24.90" },
  productType: "physical",
  rating: null,
} as unknown as Product

const addButton = () => screen.getByRole("button", { name: /Add to cart|Out of stock/ }) as HTMLButtonElement

beforeEach(() => {
  mocks.cart.canTakeOrders = true
  mocks.cart.loading = false
})

afterEach(cleanup)

describe("AddToCart", () => {
  function stubObserver() {
    let report: IntersectionObserverCallback = () => {}
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(callback: IntersectionObserverCallback) {
          report = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    return (isIntersecting: boolean, bottom: number) =>
      act(() =>
        report(
          [{ isIntersecting, boundingClientRect: { bottom } } as IntersectionObserverEntry],
          {} as IntersectionObserver,
        ),
      )
  }

  it("names the chosen size in the bar, away from the picker", async () => {
    const report = stubObserver()
    render(<AddToCart product={product} variantName="Medium" available />)
    report(false, -40)
    expect(document.querySelector("[data-sticky-bar]")?.textContent).toContain("Medium")
    vi.unstubAllGlobals()
  })

  it("keeps the bar away until the button has scrolled past", () => {
    const report = stubObserver()
    render(<AddToCart product={product} available />)
    report(false, 980)
    expect(document.querySelector("[data-sticky-bar]")).toBeNull()
    report(true, 500)
    expect(document.querySelector("[data-sticky-bar]")).toBeNull()
    report(false, -40)
    expect(document.querySelector("[data-sticky-bar]")).not.toBeNull()
    vi.unstubAllGlobals()
  })

  it("lets shoppers add to a store that can sell", () => {
    render(<AddToCart product={product} available />)
    expect(addButton().disabled).toBe(false)
    expect(screen.queryByText("This store isn't taking paid orders yet.")).toBeNull()
  })

  it("is disabled, with the reason, while the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    render(<AddToCart product={product} available />)
    expect(addButton().disabled).toBe(true)
    expect(screen.getByText("This store isn't taking paid orders yet.")).toBeTruthy()
  })

  it("disables the quantity along with the button", () => {
    mocks.cart.canTakeOrders = false
    render(<AddToCart product={product} available />)
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Increase quantity" }).disabled).toBe(true)
  })

  it("holds the quantity while an add is in flight", () => {
    mocks.cart.loading = true
    render(<AddToCart product={product} available />)
    expect(addButton().disabled).toBe(true)
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Increase quantity" }).disabled).toBe(true)
  })

  it("lets shoppers add a free product even so, since it needs no payment", () => {
    mocks.cart.canTakeOrders = false
    const free = { ...product, price: { amount: 0, currency: "EUR", formatted: "€0.00" } } as Product
    render(<AddToCart product={free} available />)
    expect(addButton().disabled).toBe(false)
    expect(screen.queryByText("This store isn't taking paid orders yet.")).toBeNull()
  })

  it("goes by the chosen variant's price", () => {
    mocks.cart.canTakeOrders = false
    const variants = [{ id: "v1", price: { amount: 0, currency: "EUR", formatted: "€0.00" } }]
    render(<AddToCart product={{ ...product, variants } as unknown as Product} variantId="v1" available />)
    expect(addButton().disabled).toBe(false)
  })

  it("still reports stock on its own", () => {
    render(<AddToCart product={product} available={false} />)
    expect(addButton().textContent).toContain("Out of stock")
    expect(screen.queryByText("This store isn't taking paid orders yet.")).toBeNull()
  })
})

describe("ConnectedProductGrid", () => {
  it("offers quick add on a store that can sell", () => {
    render(<ConnectedProductGrid products={[product]} />)
    expect(screen.queryByRole("button", { name: "Add to cart" })).toBeTruthy()
  })

  it("drops quick add while the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    render(<ConnectedProductGrid products={[product]} />)
    expect(screen.queryByRole("button", { name: "Add to cart" })).toBeNull()
  })

  it("says an empty store is adding products, not that a filter is wrong", () => {
    const { container } = render(<ConnectedProductGrid products={[]} />)
    expect(container.textContent).toContain("This store is adding products. Check back soon.")
    expect(container.textContent).not.toContain("filters")
  })
})
