import { cleanup, render, screen } from "@testing-library/react"
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
})

afterEach(cleanup)

describe("AddToCart", () => {
  it("lets shoppers add to a store that can sell", () => {
    render(<AddToCart product={product} available />)
    expect(addButton().disabled).toBe(false)
    expect(screen.queryByText("This store isn't taking orders yet.")).toBeNull()
  })

  it("is disabled, with the reason, while the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    render(<AddToCart product={product} available />)
    expect(addButton().disabled).toBe(true)
    expect(screen.getByText("This store isn't taking orders yet.")).toBeTruthy()
  })

  it("still reports stock on its own", () => {
    render(<AddToCart product={product} available={false} />)
    expect(addButton().textContent).toContain("Out of stock")
    expect(screen.queryByText("This store isn't taking orders yet.")).toBeNull()
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
})
