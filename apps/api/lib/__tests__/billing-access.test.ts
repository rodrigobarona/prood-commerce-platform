import { describe, expect, it } from "vitest"
import { canChangePlan, isLivePlanStatus, stripeLookupKey } from "@prood/billing"

describe("who can change a store's plan", () => {
  it("lets the owner change it with a live key", () => {
    expect(canChangePlan({ memberRole: "owner", userRole: "user", testMode: false })).toBe(true)
  })

  it("keeps admins and members of the store out", () => {
    expect(canChangePlan({ memberRole: "admin", userRole: "user", testMode: false })).toBe(false)
    expect(canChangePlan({ memberRole: "member", userRole: "admin", testMode: false })).toBe(false)
    expect(canChangePlan({ memberRole: null, userRole: "admin", testMode: false })).toBe(false)
  })

  it("lets only platform admins pay in test mode, so a test card buys nothing real", () => {
    expect(canChangePlan({ memberRole: "owner", userRole: "user", testMode: true })).toBe(false)
    expect(canChangePlan({ memberRole: "owner", userRole: undefined, testMode: true })).toBe(false)
    expect(canChangePlan({ memberRole: "owner", userRole: "admin", testMode: true })).toBe(true)
  })

  it("reads Better Auth's comma-joined roles", () => {
    expect(canChangePlan({ memberRole: "admin, owner", userRole: "user", testMode: false })).toBe(true)
  })
})

describe("plan sync rules", () => {
  it("keeps a paid plan on only while Stripe can still collect", () => {
    expect(["active", "trialing", "past_due"].every(isLivePlanStatus)).toBe(true)
    expect(["incomplete", "incomplete_expired", "canceled", "unpaid", "paused"].some(isLivePlanStatus)).toBe(false)
  })

  it("names each EUR price by plan", () => {
    expect(stripeLookupKey("grow")).toBe("prood_grow_monthly_eur")
  })
})
