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
    expect(screen.getByRole("link", { name: "Check out" }).getAttribute("href")).toBe("/checkout")
  })

  it("keeps checkout open for a free cart when the store can't take orders", async () => {
    const free = { ...price, amount: 0, formatted: "€0.00" }
    vi.mocked(fetch).mockImplementation(
      async () => new Response(JSON.stringify({ cart: { ...cart, totals: { subtotal: free, total: free } } })),
    )
    await openCart(false)
    expect(screen.getByRole("link", { name: "Check out" }).getAttribute("href")).toBe("/checkout")
  })

  it("shuts checkout, with the reason, when the store can't take orders", async () => {
    await openCart(false)
    expect(screen.queryByRole("link", { name: "Check out" })).toBeNull()
    expect((screen.getByRole("button", { name: "Check out" }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.getByText("This store isn't taking paid orders yet.")).toBeTruthy()
  })
})

function Quantity() {
  const { cart, updateItem } = useCart()
  return (
    <>
      <output>{cart?.items[0]?.quantity}</output>
      <button onClick={() => void updateItem("i1", (cart?.items[0]?.quantity ?? 0) + 1)}>More</button>
    </>
  )
}

describe("changing a quantity", () => {
  it("shows the new quantity before the store answers, and the store's answer after", async () => {
    let answer!: (res: Response) => void
    render(
      <CartProvider canTakeOrders>
        <Quantity />
      </CartProvider>,
    )
    await act(async () => {})
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => (answer = resolve)))
    fireEvent.click(screen.getByRole("button", { name: "More" }))
    expect(screen.getByRole("status").textContent).toBe("2")
    await act(async () => answer(new Response(JSON.stringify({ cart: { ...cart, items: [{ ...cart.items[0], quantity: 2 }] } }))))
    expect(screen.getByRole("status").textContent).toBe("2")
  })

  it("lets only the newest of overlapping changes decide, and a failure fall back to the store's cart", async () => {
    const answers: ((res: Response) => void)[] = []
    render(
      <CartProvider canTakeOrders>
        <Quantity />
      </CartProvider>,
    )
    await act(async () => {})
    vi.mocked(fetch).mockImplementation(() => new Promise((resolve) => answers.push(resolve)))
    fireEvent.click(screen.getByRole("button", { name: "More" }))
    fireEvent.click(screen.getByRole("button", { name: "More" }))
    expect(screen.getByRole("status").textContent).toBe("3")

    await act(async () => answers[0]!(new Response(JSON.stringify({ message: "No." }), { status: 409 })))
    expect(screen.getByRole("status").textContent).toBe("3")

    await act(async () => answers[1]!(new Response(JSON.stringify({ message: "Only 1 left." }), { status: 409 })))
    expect(screen.getByRole("status").textContent).toBe("1")
  })
})
