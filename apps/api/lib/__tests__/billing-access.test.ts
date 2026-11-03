import { describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"
import { canChangePlan, isLivePlanStatus, stripeLookupKey } from "@prood/billing"

vi.mock("server-only", () => ({}))

import { billingKeyMode, currentPlan, isPersonalBillingRequest } from "../auth/billing"

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

describe("personal billing", () => {
  it("refuses subscription routes that don't name a store", () => {
    expect(isPersonalBillingRequest("/subscription/upgrade", undefined)).toBe(true)
    expect(isPersonalBillingRequest("/subscription/billing-portal", "user")).toBe(true)
    expect(isPersonalBillingRequest("/subscription/cancel", "organization")).toBe(false)
  })

  it("lets Stripe's redirect and the webhook through", () => {
    expect(isPersonalBillingRequest("/subscription/success", undefined)).toBe(false)
    expect(isPersonalBillingRequest("/stripe/webhook", undefined)).toBe(false)
  })
})

function stripeWith(subscriptions: Array<{ id: string; status: string; lookupKey: string | null }>) {
  const data = subscriptions.map(({ id, status, lookupKey }) => ({
    id,
    status,
    items: { data: [{ price: { lookup_key: lookupKey } }] },
  }))
  return { subscriptions: { list: vi.fn().mockResolvedValue({ data }) } } as unknown as Stripe
}

describe("the plan Stripe says a store pays for", () => {
  it("takes the subscription still collecting, whatever order the events came in", async () => {
    const client = stripeWith([
      { id: "sub_old", status: "canceled", lookupKey: "prood_grow_monthly_eur" },
      { id: "sub_new", status: "past_due", lookupKey: "prood_scale_monthly_eur" },
    ])
    expect(await currentPlan(client, "cus_1")).toEqual({ plan: "scale", status: "past_due", stripeSubscriptionId: "sub_new" })
  })

  it("is Free when nothing is collecting, or the price isn't a Prood plan", async () => {
    expect(await currentPlan(stripeWith([{ id: "s", status: "canceled", lookupKey: "prood_grow_monthly_eur" }]), "c")).toBeNull()
    expect(await currentPlan(stripeWith([{ id: "s", status: "active", lookupKey: "something_else" }]), "c")).toBeNull()
    expect(await currentPlan(stripeWith([{ id: "s", status: "incomplete", lookupKey: "prood_grow_monthly_eur" }]), "c")).toBeNull()
  })
})

describe("billing key mode", () => {
  it("bills for real only with a live secret or restricted key", () => {
    expect(billingKeyMode("sk_live_abc")).toBe("live")
    expect(billingKeyMode("rk_live_abc")).toBe("live")
    expect(billingKeyMode("sk_test_abc")).toBe("test")
    expect(billingKeyMode("rk_test_abc")).toBe("test")
  })
})
