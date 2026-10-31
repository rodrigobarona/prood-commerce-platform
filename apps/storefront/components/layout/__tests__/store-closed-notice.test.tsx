import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ cart: { canTakeOrders: true } }))

vi.mock("@/components/providers/cart-provider", () => ({ useCart: () => mocks.cart }))

import { StoreClosedNotice } from "../store-closed-notice"

afterEach(cleanup)

describe("StoreClosedNotice", () => {
  it("tells shoppers before they try to buy", () => {
    mocks.cart.canTakeOrders = false
    render(<StoreClosedNotice />)
    expect(screen.getByRole("status").textContent).toBe("This store isn't taking paid orders yet.")
  })

  it("stays out of the way of a store that can sell", () => {
    mocks.cart.canTakeOrders = true
    const { container } = render(<StoreClosedNotice />)
    expect(container.textContent).toBe("")
  })
})
