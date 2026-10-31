import { describe, expect, it } from "vitest"
import { canFulfillOrder } from "../order-actions"

describe("canFulfillOrder", () => {
  it("ships an open order nothing is owed on", () => {
    expect(canFulfillOrder({ status: "approved", paymentStatus: "paid" })).toBe(true)
    expect(canFulfillOrder({ status: "approved", paymentStatus: "free" })).toBe(true)
    expect(canFulfillOrder({ status: "approved", paymentStatus: "partially_refunded" })).toBe(true)
  })

  it("won't ship an order that was refunded or never paid", () => {
    expect(canFulfillOrder({ status: "cancelled", paymentStatus: "refunded" })).toBe(false)
    expect(canFulfillOrder({ status: "approved", paymentStatus: "refunded" })).toBe(false)
    expect(canFulfillOrder({ status: "placed", paymentStatus: "unpaid" })).toBe(false)
  })
})
