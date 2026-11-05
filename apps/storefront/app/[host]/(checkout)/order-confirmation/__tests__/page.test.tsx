import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ fetchOrder: vi.fn(), getSession: vi.fn() }))

vi.mock("@/lib/commerce-data", () => ({
  fetchOrder: mocks.fetchOrder,
  fetchStoreInfo: async () => ({ contactEmail: "ola@loja.pt" }),
}))
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }))
vi.mock("@/components/checkout/create-account-card", () => ({ CreateAccountCard: () => <p>Create account</p> }))

import OrderConfirmationPage from "../page"

const price = (amount: number) => ({ amount, currency: "EUR", formatted: "" })

const order = {
  id: "o1",
  orderNumber: "1042",
  status: "approved",
  paymentStatus: "paid",
  fulfillmentStatus: "pending",
  paymentDetails: null,
  paymentMethod: { name: { en: "MB WAY" } },
  shippingMethod: { name: { en: "CTT Expresso" }, estimatedDays: { min: 5, max: 7 } },
  customerId: "c1",
  contactEmail: "ana@example.pt",
  shippingAddress: {
    firstName: "Ana",
    lastName: "Silva",
    phone: "+351 912 345 678",
    street: "Rua das Flores 12",
    postalCode: "1200-195",
    city: "Lisboa",
    country: "PT",
  },
  items: [{ id: "i1", name: { en: "Mug" }, quantity: 1, totalPrice: price(42) }],
  totals: { subtotal: price(42), shipping: price(4.9), tax: price(8.77), discount: null, total: price(46.9) },
}

async function open(email?: string, placed?: string) {
  render(await OrderConfirmationPage({ searchParams: Promise.resolve({ orderId: "o1", email, placed }) }))
}

beforeEach(() => {
  mocks.getSession.mockResolvedValue({ user: { id: "u1" } })
  mocks.fetchOrder.mockResolvedValue(order)
})

afterEach(cleanup)

describe("OrderConfirmationPage", () => {
  it("shows VAT inside the total rather than as a row above it", async () => {
    await open()
    expect(screen.getByText("Including €8.77 VAT")).toBeTruthy()
    expect(screen.queryByText("Tax")).toBeNull()
  })

  it("lists contact, address, payment and shipping for the account that placed it", async () => {
    await open()
    expect(screen.getByText("ana@example.pt")).toBeTruthy()
    expect(screen.getByText("+351 912 345 678")).toBeTruthy()
    expect(screen.getByText("Rua das Flores 12")).toBeTruthy()
    expect(screen.getByText("1200-195 Lisboa")).toBeTruthy()
    expect(screen.getByText("Portugal")).toBeTruthy()
    expect(screen.getByText("MB WAY")).toBeTruthy()
    expect(screen.getByText("Paid", { selector: "dd" })).toBeTruthy()
    expect(screen.getByText("CTT Expresso, 5–7 days")).toBeTruthy()
  })

  it("promises the confirmation just after placing the order", async () => {
    await open(undefined, "1")
    expect(screen.getByText("We'll email your confirmation.")).toBeTruthy()
  })

  it("doesn't promise it on an order opened later, from the account", async () => {
    await open()
    expect(screen.queryByText(/We'll email your confirmation/)).toBeNull()
  })

  it("says what's still owed on a canceled order that was partly refunded", async () => {
    mocks.fetchOrder.mockResolvedValue({ ...order, status: "cancelled", paymentStatus: "partially_refunded" })
    const { container } = render(
      await OrderConfirmationPage({ searchParams: Promise.resolve({ orderId: "o1" }) }),
    )
    expect(container.textContent).toContain(
      "This order was canceled and part of your payment was returned. The rest hasn't been returned yet. Contact the store about your refund.",
    )
  })

  it("shows each item's photo, or its initial when it has none", async () => {
    const photo = { url: "/mug.jpg", alt: "A mug" }
    mocks.fetchOrder.mockResolvedValue({
      ...order,
      items: [
        { ...order.items[0], image: photo },
        { ...order.items[0], id: "i2", name: { en: "Bowl" }, image: null },
      ],
    })
    await open()
    expect(document.querySelector('img[src*="mug.jpg"]')).toBeTruthy()
    expect(screen.getByText("B").getAttribute("aria-hidden")).toBe("true")
  })

  it("tells a guest which address the confirmation went to, from their link", async () => {
    mocks.getSession.mockResolvedValue(null)
    mocks.fetchOrder.mockResolvedValue({ ...order, customerId: null, contactEmail: null, shippingAddress: null })
    await open("ana@example.pt", "1")
    expect(screen.getByText("We'll email your confirmation to ana@example.pt.")).toBeTruthy()
  })

  describe("for a guest, whose order comes back without its address", () => {
    const guestOrder = { ...order, customerId: null, contactEmail: null, shippingAddress: null }
    const line = "Shipping to the address you gave at checkout. To check it, contact the store."

    beforeEach(() => mocks.getSession.mockResolvedValue(null))

    it("points to the store, since signing in doesn't bring a guest order along", async () => {
      mocks.fetchOrder.mockResolvedValue(guestOrder)
      const { container } = render(
        await OrderConfirmationPage({ searchParams: Promise.resolve({ orderId: "o1", email: "ana@example.pt" }) }),
      )
      expect(container.textContent).toContain(line)
      expect(screen.queryByRole("link", { name: "Sign in" })).toBeNull()
    })

    it("leaves it out of an order with nothing to ship", async () => {
      mocks.fetchOrder.mockResolvedValue({ ...guestOrder, shippingMethod: null })
      const { container } = render(
        await OrderConfirmationPage({ searchParams: Promise.resolve({ orderId: "o1" }) }),
      )
      expect(container.textContent).not.toContain(line)
    })
  })

  it("doesn't point anyone at an email for an order it can't find", async () => {
    mocks.fetchOrder.mockRejectedValue(new Error("NOT_FOUND"))
    await open()
    expect(screen.getByText("We couldn't find this order. Contact the store with your order number.")).toBeTruthy()
  })

  it("puts creating an account after the way back to the store", async () => {
    mocks.getSession.mockResolvedValue(null)
    await open("ana@example.pt")
    const link = screen.getByRole("link", { name: "Continue shopping" })
    const card = screen.getByText("Create account")
    expect(link.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
