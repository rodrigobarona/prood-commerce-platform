import { describe, expect, it } from "vitest"
import { canCheckOut, isFree } from "../store-status"

const cartOf = (amount: number) => ({
  totals: { total: { amount } },
}) as Parameters<typeof canCheckOut>[1]

describe("canCheckOut", () => {
  it("is open whenever the store can take orders", () => {
    expect(canCheckOut(true, cartOf(24.9))).toBe(true)
    expect(canCheckOut(true, null)).toBe(true)
  })

  it("is open without a provider only when there's nothing to pay", () => {
    expect(canCheckOut(false, cartOf(0))).toBe(true)
    expect(canCheckOut(false, cartOf(24.9))).toBe(false)
  })

  it("is shut with no cart to go by", () => {
    expect(canCheckOut(false, null)).toBe(false)
  })
})

describe("isFree", () => {
  it("doesn't take a missing price for a free one", () => {
    expect(isFree(null)).toBe(false)
    expect(isFree(undefined)).toBe(false)
  })
})
