import { describe, expect, it } from "vitest"
import {
  apiKeyStatus,
  domainStatus,
  historyLabel,
  integrationStatus,
  orderState,
  orderStatus,
  paymentException,
  paymentStatus,
  planStatus,
  productState,
} from "../status"

describe("paymentException", () => {
  const order = (paymentStatus: string, status = "placed", fulfillmentStatus = "unfulfilled") =>
    ({ status, paymentStatus, fulfillmentStatus }) as Parameters<typeof paymentException>[0]

  it.each(["unpaid", "authorized", "paid", "free", "refunded"])("stays out of the way for %s", (payment) => {
    expect(paymentException(order(payment))).toBeNull()
  })

  it("doesn't repeat a failure the state already says", () => {
    expect(paymentException(order("voided"))).toBeNull()
  })

  it("shows the exceptions a state can't", () => {
    expect(paymentException(order("partially_refunded", "fulfilled", "fulfilled"))).toBe("Partially refunded")
    expect(paymentException(order("voided", "cancelled"))).toBe("Payment failed")
  })
})

describe("domainStatus", () => {
  it("has one quiet state where domains can't connect, verified or not", () => {
    expect(domainStatus(true, false)).toEqual({ label: "Saved, not connected", tone: "neutral" })
    expect(domainStatus(false, false)).toEqual({ label: "Saved, not connected", tone: "neutral" })
  })

  it("asks for action on a pending domain where someone can take it", () => {
    expect(domainStatus(false, true)).toMatchObject({ label: "Pending", needsAction: true })
    expect(domainStatus(true, true)).toMatchObject({ label: "Verified", tone: "success" })
  })
})

describe("status map", () => {
  it("labels API values in plain words", () => {
    expect(paymentStatus("partially_refunded").label).toBe("Partially refunded")
    expect(orderStatus("placed")).toEqual({ label: "New", tone: "neutral" })
  })

  it("calls a voided payment what it means to a merchant", () => {
    expect(paymentStatus("voided")).toEqual({ label: "Failed", tone: "danger" })
  })

  it("doesn't call a cancelled order an error", () => {
    expect(orderStatus("cancelled").tone).toBe("neutral")
  })

  it("reads a value it hasn't met, quietly", () => {
    expect(orderStatus("on_hold")).toEqual({ label: "On hold", tone: "neutral" })
  })

  it("never uses Telha for a status", () => {
    const looks = [orderStatus("placed"), paymentStatus("paid"), domainStatus(false, true), integrationStatus(null)]
    expect(looks.map((look) => look.tone)).not.toContain("brand")
  })

  it("tells connected apart from turned off", () => {
    expect(integrationStatus({ enabled: true }).label).toBe("Connected")
    expect(integrationStatus({ enabled: false }).label).toBe("Turned off")
    expect(integrationStatus(undefined).label).toBe("Not connected")
  })

  it("calls a revoked key revoked", () => {
    expect(apiKeyStatus(false).label).toBe("Revoked")
  })

  it("fills only what someone has to act on", () => {
    expect(domainStatus(false, true).needsAction).toBe(true)
    expect(planStatus("past_due").needsAction).toBe(true)
    expect(domainStatus(true, true).needsAction).toBeUndefined()
    expect(planStatus("active").needsAction).toBeUndefined()
    expect(apiKeyStatus(false).needsAction).toBeUndefined()
    expect(integrationStatus({ enabled: true }).needsAction).toBeUndefined()
  })

  it("shares a word between an order tab and its rows", () => {
    expect(orderStatus("approved").label).toBe(
      orderState({ status: "approved", paymentStatus: "paid", fulfillmentStatus: "in_progress" } as never).label
    )
  })

  it("writes history as events", () => {
    expect(historyLabel("paid")).toBe("Payment received")
    expect(historyLabel("in_transit")).toBe("In transit")
  })

  describe("orderState", () => {
    const order = (status: string, paymentStatus: string, fulfillmentStatus: string) =>
      orderState({ status, paymentStatus, fulfillmentStatus } as Parameters<typeof orderState>[0])

    it("flags a paid order that still has to ship", () => {
      expect(order("placed", "paid", "unfulfilled")).toMatchObject({ label: "To fulfill", needsAction: true })
    })

    it.each([
      ["placed", "voided", "unfulfilled", "Payment failed"],
      ["placed", "unpaid", "unfulfilled", "Awaiting payment"],
      ["placed", "authorized", "unfulfilled", "Confirming payment"],
      ["approved", "paid", "in_progress", "In progress"],
      ["approved", "paid", "not_required", "Complete"],
      ["fulfilled", "paid", "fulfilled", "Fulfilled"],
      ["cancelled", "unpaid", "unfulfilled", "Canceled"],
      ["cancelled", "voided", "unfulfilled", "Canceled"],
      ["cancelled", "refunded", "unfulfilled", "Refunded"],
    ])("leaves %s, %s and %s quiet, as %s", (status, payment, fulfillment, label) => {
      const look = order(status, payment, fulfillment)
      expect(look.label).toBe(label)
      expect(look.needsAction).toBeUndefined()
    })
  })

  describe("productState", () => {
    const price = { amount: 10, currency: "EUR", formatted: "€10.00" } as never

    it("stays quiet for a product on sale", () => {
      expect(productState({ status: "active", price, inStock: true })).toEqual({ label: "Active", tone: "success" })
    })

    it("flags what stops an active product selling", () => {
      expect(productState({ status: "active", price: null, inStock: true }).label).toBe("No price")
      expect(productState({ status: "active", price, inStock: false }).label).toBe("Out of stock")
    })

    it("doesn't nag about a draft", () => {
      expect(productState({ status: "draft", price: null, inStock: true }).needsAction).toBeUndefined()
    })
  })
})
