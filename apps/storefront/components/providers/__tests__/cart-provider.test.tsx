import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { CartProvider, useCart } from "../cart-provider"

const price = { amount: 24.9, currency: "EUR", formatted: "€24.90" }
const cart = {
  id: "c1",
  itemCount: 1,
  items: [
    {
      id: "i1",
      productId: "p1",
      name: { en: "Taça" },
      quantity: 1,
      price,
      totalPrice: price,
    },
  ],
  totals: { subtotal: price, total: price },
}

function OpenDrawer() {
  const { openDrawer } = useCart()
  return <button onClick={openDrawer}>Open cart</button>
}

async function openCart(canTakeOrders: boolean) {
  render(
    <CartProvider canTakeOrders={canTakeOrders}>
      <OpenDrawer />
    </CartProvider>,
  )
  await act(async () => {})
  fireEvent.click(screen.getByRole("button", { name: "Open cart" }))
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(JSON.stringify({ cart }))),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe("the cart drawer", () => {
  it("links to checkout from a store that can sell", async () => {
    await openCart(true)
    expect(screen.getByRole("link", { name: "Checkout" }).getAttribute("href")).toBe("/checkout")
  })

  it("shuts checkout, with the reason, when the store can't take orders", async () => {
    await openCart(false)
    expect(screen.queryByRole("link", { name: "Checkout" })).toBeNull()
    expect((screen.getByRole("button", { name: "Checkout" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText("This store isn't taking orders yet.")).toBeTruthy()
  })
})
