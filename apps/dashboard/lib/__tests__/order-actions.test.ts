import { describe, expect, it } from "vitest"
import { canFulfillOrder } from "../order-actions"

describe("canFulfillOrder", () => {
  it("ships an open order nothing is owed on", () => {
    expect(canFulfillOrder({ status: "approved", paymentStatus: "paid", fulfillmentStatus: "unfulfilled" })).toBe(true)
    expect(canFulfillOrder({ status: "approved", paymentStatus: "free", fulfillmentStatus: "unfulfilled" })).toBe(true)
    expect(canFulfillOrder({ status: "approved", paymentStatus: "partially_refunded", fulfillmentStatus: "unfulfilled" })).toBe(true)
  })

  it("won't ship an order that was refunded or never paid", () => {
    expect(canFulfillOrder({ status: "cancelled", paymentStatus: "refunded", fulfillmentStatus: "unfulfilled" })).toBe(false)
    expect(canFulfillOrder({ status: "approved", paymentStatus: "refunded", fulfillmentStatus: "unfulfilled" })).toBe(false)
    expect(canFulfillOrder({ status: "placed", paymentStatus: "unpaid", fulfillmentStatus: "unfulfilled" })).toBe(false)
  })

  it("doesn't offer fulfilment when there's nothing to ship", () => {
    expect(
      canFulfillOrder({ status: "approved", paymentStatus: "paid", fulfillmentStatus: "not_required" })
    ).toBe(false)
  })
})
