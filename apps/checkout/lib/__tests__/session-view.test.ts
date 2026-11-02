import { describe, expect, it } from "vitest"
import type { StoredSession } from "@prood/checkout-host"
import type { Order } from "@prood/types"
import { orderSummary, sessionView } from "../session-view"

const address = { firstName: "Ana", street1: "Rua 1", city: "Lisboa", country: "PT" }

const snapshot = {
  state: "payment",
  channel: "hosted",
  fulfillment: "none",
  expiresAt: null,
  customerInfo: { email: "ana@example.pt" },
  shippingAddress: address,
  billingAddress: address,
  shippingMethodId: "standard",
  amount: 10,
  currency: "EUR",
  orderId: "order-1",
  error: null,
  paymentSession: {
    id: "p1",
    providerId: "easypay",
    status: "pending",
    method: "multibanco",
    amount: 10,
    currency: "EUR",
    redirectUrl: null,
    createdAt: "2026-10-31T00:00:00.000Z",
    providerData: { entity: "1", reference: "2", raw: { customer: { phone: "912345678" } } },
  },
} as unknown as StoredSession["snapshot"]

describe("sessionView", () => {
  it("keeps what the payment page reads", () => {
    expect(sessionView(snapshot)).toMatchObject({
      state: "payment",
      amount: 10,
      customerInfo: { email: "ana@example.pt" },
      paymentSession: { id: "p1", providerData: { entity: "1", reference: "2" } },
    })
  })

  it("leaves out addresses and the provider's raw response", () => {
    const body = JSON.stringify(sessionView(snapshot))

    expect(body).not.toContain("Rua 1")
    expect(body).not.toContain("912345678")
    expect(body).not.toContain("raw")
  })

  it("copes with a session nobody has paid yet", () => {
    expect(sessionView({ ...snapshot, paymentSession: null }).paymentSession).toBeNull()
  })
})

describe("orderSummary", () => {
  const order = {
    orderNumber: "1042",
    customerId: null,
    contactEmail: "ana@example.pt",
    totals: { shipping: { amount: 15, currency: "EUR" } },
    items: [
      {
        id: "i1",
        name: { en: "Taça" },
        variantName: null,
        quantity: 2,
        totalPrice: { amount: 48, currency: "EUR" },
      },
    ],
  } as unknown as Order

  it("names the order and where its confirmation went", () => {
    expect(orderSummary(order)).toEqual({
      number: "1042",
      contactEmail: "ana@example.pt",
      emailed: true,
      items: [{ id: "i1", name: "Taça", variantName: null, quantity: 2, amount: 48 }],
      shipping: 15,
    })
  })

  it("won't name the address for an account, which is emailed elsewhere", () => {
    expect(orderSummary({ ...order, customerId: "c1" })).toMatchObject({ contactEmail: null, emailed: true })
  })

  it("doesn't promise an email to a guest who gave no address", () => {
    expect(orderSummary({ ...order, contactEmail: null })).toMatchObject({ emailed: false })
  })

  it("has nothing to say for a payment link with no order", () => {
    expect(orderSummary(null)).toBeNull()
  })
})
