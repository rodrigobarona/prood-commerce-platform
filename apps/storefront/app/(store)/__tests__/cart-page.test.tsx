import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const price = (amount: number) => ({ amount, currency: "EUR", formatted: `€${amount.toFixed(2)}` })

const mocks = vi.hoisted(() => ({
  cart: {
    canTakeOrders: true,
    loading: false,
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
    applyCoupon: vi.fn(),
    removeCoupon: vi.fn(),
    cart: null as unknown,
  },
}))

vi.mock("@/components/providers/cart-provider", () => ({ useCart: () => mocks.cart }))
vi.mock("@prood/ui/components/cart-item", () => ({ CartItemRow: () => null }))
vi.mock("@/components/cart/save-for-later", () => ({
  SaveForLaterSection: () => null,
  cartItemToSaved: vi.fn(),
  useSavedItems: () => ({ items: [], save: vi.fn(), remove: vi.fn() }),
}))

import CartPage from "../cart/page"

beforeEach(() => {
  mocks.cart.canTakeOrders = true
  mocks.cart.cart = {
    items: [{ id: "i1" }],
    itemCount: 1,
    totals: { subtotal: price(24.9), total: price(24.9) },
  }
})

afterEach(cleanup)

describe("CartPage", () => {
  it("makes no claims the merchant didn't make", () => {
    const { container } = render(<CartPage />)
    expect(container.textContent).not.toMatch(/Easy returns|Data protection|Safe payment|Secure checkout/)
  })

  it("links to checkout from a store that can sell", () => {
    render(<CartPage />)
    expect(screen.getByRole("link", { name: "Proceed to checkout" }).getAttribute("href")).toBe("/checkout")
  })

  it("keeps checkout open for a free cart when the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    mocks.cart.cart = {
      items: [{ id: "i1" }],
      itemCount: 1,
      totals: { subtotal: price(0), total: price(0) },
    }
    render(<CartPage />)
    expect(screen.getByRole("link", { name: "Proceed to checkout" }).getAttribute("href")).toBe("/checkout")
    expect(screen.queryByText("This store isn't taking orders yet.")).toBeNull()
  })

  it("shuts both ways to checkout, with the reason, when the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    render(<CartPage />)
    expect(screen.queryByRole("link", { name: /checkout/i })).toBeNull()
    const buttons = screen.getAllByRole("button", { name: "Proceed to checkout" }) as HTMLButtonElement[]
    expect(buttons).toHaveLength(2)
    expect(buttons.every((button) => button.disabled)).toBe(true)
    expect(screen.getAllByText("This store isn't taking orders yet.")).toHaveLength(2)
  })
})
