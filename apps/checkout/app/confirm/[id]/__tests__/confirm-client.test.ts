import { describe, expect, it } from "vitest"
import { statusFor } from "../confirm-client"

describe("statusFor", () => {
  it("shows pending for authorized funds, not a closed order", () => {
    expect(statusFor({ state: "pending", payable: false })).toBe("pending")
  })

  it("closes an order that can't be paid", () => {
    expect(statusFor({ state: "failed", payable: false })).toBe("closed")
  })

  it("offers a retry on a payment that failed", () => {
    expect(statusFor({ state: "failed", payable: true })).toBe("failed")
  })

  it("keeps waiting on a started payment", () => {
    expect(statusFor({ state: "payment", payable: true })).toBe("pending")
  })

  it("confirms a finished payment", () => {
    expect(statusFor({ state: "complete", payable: false })).toBe("complete")
  })
})
