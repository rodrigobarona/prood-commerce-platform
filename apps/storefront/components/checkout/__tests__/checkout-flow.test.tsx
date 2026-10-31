import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  cart: {
    canTakeOrders: false,
    hydrating: false,
    setShippingMethod: vi.fn(),
    cart: {
      id: "c1",
      items: [{ id: "i1" }],
      requiresShipping: false,
      totals: { total: { amount: 24.9 } },
    },
  },
}))

vi.mock("@/components/providers/cart-provider", () => ({ useCart: () => mocks.cart }))
vi.mock("@/app/(checkout)/checkout/actions", () => ({ startCheckout: vi.fn() }))
vi.mock("../checkout-sidebar", () => ({ CheckoutSidebar: () => null }))
vi.mock("../steps/contact-step", () => ({ ContactStep: () => <p>Contact form</p> }))
vi.mock("../steps/address-step", () => ({ AddressStep: () => null }))
vi.mock("../steps/shipping-step", () => ({ ShippingStep: () => null }))
vi.mock("../steps/review-step", () => ({ ReviewStep: () => null }))

import { CheckoutFlow } from "../checkout-flow"

beforeEach(() => {
  mocks.cart.canTakeOrders = false
  mocks.cart.hydrating = false
  mocks.cart.cart.totals.total.amount = 24.9
})

afterEach(cleanup)

describe("CheckoutFlow", () => {
  it("stops a shopper at the door when the store can't take orders", () => {
    render(<CheckoutFlow />)
    expect(screen.getByRole("heading", { name: "This store isn't taking paid orders yet." })).toBeTruthy()
    expect(screen.queryByText("Contact form")).toBeNull()
  })

  it("opens for a store that can", () => {
    mocks.cart.canTakeOrders = true
    render(<CheckoutFlow />)
    expect(screen.getByText("Contact form")).toBeTruthy()
  })

  it("opens for a free order, which needs no payment provider", () => {
    mocks.cart.cart.totals.total.amount = 0
    render(<CheckoutFlow />)
    expect(screen.getByText("Contact form")).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "This store isn't taking paid orders yet." })).toBeNull()
  })

  it("waits for the cart before deciding", () => {
    mocks.cart.hydrating = true
    render(<CheckoutFlow />)
    expect(screen.queryByRole("heading", { name: "This store isn't taking paid orders yet." })).toBeNull()
  })
})
