import { describe, expect, it } from "vitest"
import { getEntitlements } from "@prood/billing"
import { domainLimitMessage, overPlanNote, planUsage, seatLimitMessage } from "../plan-usage"

const counts = { products: 12, ordersThisMonth: 40, teamSeats: 3, customDomains: 1 }

describe("planUsage", () => {
  it("sets real use against the plan's limits", () => {
    const rows = planUsage(getEntitlements("free"), counts)
    expect(rows.find((row) => row.label === "Products")).toMatchObject({ used: 12, limit: 50, over: false, percent: 24 })
  })

  it("says so when a store is over a limit", () => {
    const seats = planUsage(getEntitlements("free"), counts).find((row) => row.label === "Team seats")
    expect(seats).toMatchObject({ used: 3, limit: 1, over: true, percent: 100 })
  })

  it("draws no meter for something unlimited", () => {
    const limits = { ...getEntitlements("free"), maxProducts: null }
    expect(planUsage(limits, counts)[0]).toMatchObject({ limit: null, over: false, percent: 0 })
  })
})

describe("limit messages", () => {
  it("doesn't send anyone to an upgrade that doesn't exist", () => {
    const copy = [seatLimitMessage(1), seatLimitMessage(5), domainLimitMessage(1), domainLimitMessage(3)]
    for (const message of copy) {
      expect(message).not.toMatch(/upgrade/i)
      expect(message).toContain("Paid plans can't be bought yet.")
    }
  })

  it("explains team invites on Free", () => {
    expect(seatLimitMessage(1)).toBe("Team invites start on Grow. Paid plans can't be bought yet.")
  })
})

describe("planUsage where domains can't connect", () => {
  it("has no domain meter, and no domain in the over-plan note", () => {
    const rows = planUsage(getEntitlements("free"), { ...counts, teamSeats: 4, customDomains: null })
    expect(rows.map((row) => row.label)).not.toContain("Custom domains")
    expect(overPlanNote(rows)).not.toContain("domains")
  })
})

describe("overPlanNote", () => {
  it("says what being over means, once, for everything over", () => {
    const rows = planUsage(getEntitlements("free"), { ...counts, teamSeats: 4, customDomains: 2 })
    expect(overPlanNote(rows)).toBe(
      "What you have keeps working, but you can't add more team seats and custom domains while you're over."
    )
  })

  it("has nothing to say under the limits", () => {
    expect(overPlanNote(planUsage(getEntitlements("free"), { ...counts, teamSeats: 1 }))).toBeNull()
  })
})
