import { describe, expect, it } from "vitest"
import type { Order } from "@prood/types"
import { isOrderEmail, publicOrder } from "../order-view"

const order = {
  id: "order-1",
  orderNumber: "1001",
  status: "placed",
  paymentStatus: "unpaid",
  items: [{ id: "item-1" }],
  totals: { total: { amount: 10, currency: "EUR" } },
  shippingAddress: { firstName: "Ana", street1: "Rua 1" },
  billingAddress: { firstName: "Ana", street1: "Rua 1" },
  paymentProvider: "easypay",
  paymentTransactionId: "tx_1",
  paymentDetails: { method: "multibanco", entity: "1", reference: "2", expiresAt: null },
  note: "Leave at the door",
  trackingNumber: "T1",
  trackingUrl: "https://track.example/T1",
  customerId: "customer-1",
  contactEmail: "ana@example.pt",
} as unknown as Order

describe("publicOrder", () => {
  it("gives someone with only the id no personal or payment details", () => {
    const view = publicOrder(order, false)

    expect(JSON.stringify(view)).not.toMatch(/Rua 1|tx_1|easypay|ana@example|Leave at the door|customer-1/)
    expect(view.paymentDetails).toBeNull()
  })

  it("keeps what the confirmation page shows", () => {
    expect(publicOrder(order, false)).toMatchObject({
      orderNumber: "1001",
      status: "placed",
      paymentStatus: "unpaid",
      items: [{ id: "item-1" }],
      totals: order.totals,
    })
  })

  it("shows a guest the reference to pay, with the order's email", () => {
    const view = publicOrder(order, true)

    expect(view.paymentDetails).toEqual(order.paymentDetails)
    expect(view.shippingAddress).toBeNull()
    expect(view.paymentTransactionId).toBeNull()
  })
})

describe("isOrderEmail", () => {
  it("ignores case and stray spaces", () => {
    expect(isOrderEmail(order, " Ana@Example.PT ")).toBe(true)
  })

  it("refuses another email, or none", () => {
    expect(isOrderEmail(order, "bruno@example.pt")).toBe(false)
    expect(isOrderEmail(order, undefined)).toBe(false)
    expect(isOrderEmail({ contactEmail: null }, "ana@example.pt")).toBe(false)
  })
})
