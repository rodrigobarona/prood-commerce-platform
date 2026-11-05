import { act, cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  startCheckout: vi.fn(),
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
vi.mock("@/app/[host]/(checkout)/checkout/actions", () => ({ startCheckout: mocks.startCheckout }))
vi.mock("../checkout-sidebar", () => ({ CheckoutSidebar: () => null }))
vi.mock("../steps/contact-step", () => ({
  ContactStep: ({
    defaultValues,
    onSubmit,
  }: {
    defaultValues?: { email?: string }
    onSubmit: (values: { email: string }) => void
  }) => (
    <button type="button" onClick={() => onSubmit({ email: "ana@example.pt" })}>
      Contact form {defaultValues?.email}
    </button>
  ),
}))
vi.mock("../steps/address-step", () => ({
  AddressStep: ({ storeCountry }: { storeCountry?: string }) => <p>Address form {storeCountry}</p>,
}))
vi.mock("../steps/shipping-step", () => ({ ShippingStep: () => null }))
vi.mock("../steps/review-step", () => ({
  ReviewStep: ({ demo, onSubmit }: { demo: boolean; onSubmit: () => Promise<void> }) => (
    <button type="button" onClick={() => void onSubmit()}>
      {demo ? "Demo review" : "Place order"}
    </button>
  ),
}))

import { CheckoutFlow } from "../checkout-flow"

beforeEach(() => {
  mocks.cart.canTakeOrders = false
  mocks.cart.hydrating = false
  mocks.cart.cart.totals.total.amount = 24.9
  sessionStorage.clear()
})

afterEach(cleanup)

describe("CheckoutFlow", () => {
  it("stops a shopper at the door when the store can't take orders", () => {
    render(<CheckoutFlow />)
    expect(screen.getByRole("heading", { name: "This store isn't taking paid orders yet." })).toBeTruthy()
    expect(screen.queryByRole("button", { name: /Contact form/ })).toBeNull()
  })

  it("opens for a store that can", () => {
    mocks.cart.canTakeOrders = true
    render(<CheckoutFlow />)
    expect(screen.getByRole("button", { name: /Contact form/ })).toBeTruthy()
  })

  it("opens for a free order, which needs no payment provider", () => {
    mocks.cart.cart.totals.total.amount = 0
    render(<CheckoutFlow />)
    expect(screen.getByRole("button", { name: /Contact form/ })).toBeTruthy()
    expect(screen.queryByRole("heading", { name: "This store isn't taking paid orders yet." })).toBeNull()
  })

  it("moves focus to the step it opens", () => {
    mocks.cart.canTakeOrders = true
    render(<CheckoutFlow />)
    fireEvent.click(screen.getByRole("button", { name: /Contact form/ }))
    expect(document.activeElement?.textContent).toContain("Shipping address")
  })

  it("picks up where a reload left off", () => {
    mocks.cart.canTakeOrders = true
    sessionStorage.setItem("prood-checkout", JSON.stringify({ contact: { email: "ana@example.pt" }, step: 1 }))
    render(<CheckoutFlow storeCountry="PT" />)
    expect(screen.getByText("Address form PT")).toBeTruthy()
    expect(screen.getByText("ana@example.pt")).toBeTruthy()
  })

  it("won't resume past a step that doesn't hold up", () => {
    mocks.cart.canTakeOrders = true
    sessionStorage.setItem("prood-checkout", JSON.stringify({ contact: { email: "ana@" }, step: 3 }))
    render(<CheckoutFlow />)
    expect(screen.getByRole("button", { name: /Contact form ana@/ })).toBeTruthy()
  })

  describe("at the last step", () => {
    const draft = {
      contact: { email: "ana@example.pt" },
      address: { firstName: "Ana", lastName: "Silva", street: "Rua 1", city: "Lisboa", postalCode: "1200-195", country: "PT" },
      step: 3,
    }

    beforeEach(() => {
      mocks.cart.canTakeOrders = true
      sessionStorage.setItem("prood-checkout", JSON.stringify(draft))
    })

    it("says so when the store turns the order down", async () => {
      mocks.startCheckout.mockResolvedValue({ ok: false, closed: true, error: "No." })
      render(<CheckoutFlow />)
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Place order" }))
      })
      expect(screen.getByRole("heading", { name: "This store isn't taking orders right now" })).toBeTruthy()
    })

    it("forgets the draft once the order is placed", async () => {
      mocks.startCheckout.mockResolvedValue({ ok: true })
      render(<CheckoutFlow />)
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Place order" }))
      })
      expect(sessionStorage.getItem("prood-checkout")).toBeNull()
    })

    it("sends the phone from the contact step, the only place it's asked for", async () => {
      sessionStorage.setItem(
        "prood-checkout",
        JSON.stringify({ ...draft, contact: { email: "ana@example.pt", phone: "912345678" } }),
      )
      mocks.startCheckout.mockResolvedValue({ ok: true })
      render(<CheckoutFlow />)
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Place order" }))
      })
      expect(mocks.startCheckout.mock.lastCall?.[0].phone).toBe("912345678")
    })

    it("tells the demo store's review apart", () => {
      render(<CheckoutFlow demo />)
      expect(screen.getByRole("button", { name: "Demo review" })).toBeTruthy()
    })
  })

  it("waits for the cart before deciding", () => {
    mocks.cart.hydrating = true
    render(<CheckoutFlow />)
    expect(screen.queryByRole("heading", { name: "This store isn't taking paid orders yet." })).toBeNull()
  })
})
