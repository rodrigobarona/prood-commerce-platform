import { act, cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const price = (amount: number) => ({ amount, currency: "EUR", formatted: `€${amount.toFixed(2)}` })

const mocks = vi.hoisted(() => ({
  cart: {
    canTakeOrders: true,
    loading: false,
    addItem: vi.fn(),
    updateItem: vi.fn(),
    removeItem: vi.fn(),
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

import { CartView } from "@/components/cart/cart-view"

const CartPage = () => <CartView suggestions={<p>Suggested products</p>} />

/** Stands in for the real thing, which needs a layout to say anything. */
function stubViewport() {
  let report: (entries: { isIntersecting: boolean }[]) => void = () => {}
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(callback: typeof report) {
        report = callback
      }
      observe() {}
      disconnect() {}
    },
  )
  return (visible: boolean) => act(() => report([{ isIntersecting: visible }]))
}

beforeEach(() => {
  mocks.cart.canTakeOrders = true
  mocks.cart.cart = {
    items: [{ id: "i1" }],
    itemCount: 1,
    totals: { subtotal: price(24.9), total: price(24.9) },
  }
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("CartPage", () => {
  it("makes no claims the merchant didn't make", () => {
    const { container } = render(<CartPage />)
    expect(container.textContent).not.toMatch(/Easy returns|Data protection|Safe payment|Secure checkout/)
  })

  it("doesn't call it a total before shipping", () => {
    mocks.cart.cart = {
      items: [{ id: "i1" }],
      itemCount: 1,
      requiresShipping: true,
      totals: { subtotal: price(24.9), total: price(24.9) },
    }
    const { container } = render(<CartPage />)
    expect(screen.getByText("Subtotal")).toBeTruthy()
    expect(screen.queryByText("Total")).toBeNull()
    expect(container.textContent).toContain("Shipping from €15.00, added at checkout.")
  })

  it("calls it an estimate once something stands between subtotal and total", () => {
    mocks.cart.cart = {
      items: [{ id: "i1" }],
      itemCount: 1,
      requiresShipping: true,
      totals: { subtotal: price(24.9), discount: price(4.9), total: price(20) },
    }
    render(<CartPage />)
    expect(screen.getByText("Estimated total")).toBeTruthy()
  })

  it("shows VAT as part of the total, not a charge on top", () => {
    mocks.cart.cart = {
      items: [{ id: "i1" }],
      itemCount: 1,
      totals: { subtotal: price(24.9), tax: price(4.66), total: price(24.9) },
    }
    render(<CartPage />)
    expect(screen.getByText("Including €4.66 VAT")).toBeTruthy()
    expect(screen.queryByText("Tax")).toBeNull()
  })

  it("links to checkout from a store that can sell", () => {
    render(<CartPage />)
    expect(screen.getByRole("link", { name: "Check out" }).getAttribute("href")).toBe("/checkout")
  })

  it("keeps checkout open for a free cart when the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    mocks.cart.cart = {
      items: [{ id: "i1" }],
      itemCount: 1,
      totals: { subtotal: price(0), total: price(0) },
    }
    render(<CartPage />)
    expect(screen.getByRole("link", { name: "Check out" }).getAttribute("href")).toBe("/checkout")
    expect(screen.queryByText("This store isn't taking paid orders yet.")).toBeNull()
  })

  it("shuts checkout, with the reason, when the store can't take orders", () => {
    mocks.cart.canTakeOrders = false
    render(<CartPage />)
    expect(screen.queryByRole("link", { name: "Check out" })).toBeNull()
    const button = screen.getByRole("button", { name: "Check out" }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    expect(screen.getByText("This store isn't taking paid orders yet.")).toBeTruthy()
    expect(document.querySelector("[data-sticky-bar]")).toBeNull()
  })

  it("shows the bar only while the real button is out of sight", () => {
    const setVisible = stubViewport()
    render(<CartPage />)
    expect(document.querySelector("[data-sticky-bar]")).toBeNull()

    setVisible(false)
    const bar = document.querySelector("[data-sticky-bar]")
    expect(bar?.textContent).toContain("Check out")
    expect(bar?.textContent).toContain("€24.90")

    setVisible(true)
    expect(document.querySelector("[data-sticky-bar]")).toBeNull()
  })

  it("offers products only when the cart is empty", () => {
    render(<CartPage />)
    expect(screen.queryByText("Suggested products")).toBeNull()
    cleanup()

    mocks.cart.cart = null
    render(<CartPage />)
    expect(screen.getByText("Suggested products")).toBeTruthy()
  })
})
