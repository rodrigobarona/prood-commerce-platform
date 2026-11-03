import { eq } from "drizzle-orm"

import {
  canChangePlan,
  defaultPlanId,
  getPlan,
  isValidPlanId,
  type PlanId,
} from "@prood/billing"

import { getActiveMemberRole, getActiveOrganizationId, getCurrentUser } from "./auth"
import { authDb } from "./auth/db"
import { organization, subscription } from "./auth/schema"

export type OrganizationPlanSnapshot = {
  organizationId: string
  planId: PlanId
  planStatus: string
  planName: string
  /** Billed through Stripe. A plan set by hand in admin has no subscription. */
  subscribed: boolean
  /** When a cancelled subscription stops. The store moves to Free then. */
  endsAt: Date | null
  /** Has paid through Stripe before, so its invoices are in Stripe's billing page. */
  hasBillingHistory: boolean
}

export async function getActiveOrganizationPlan(): Promise<OrganizationPlanSnapshot | null> {
  const orgId = await getActiveOrganizationId()
  if (!orgId) return null

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return {
      organizationId: orgId,
      planId: defaultPlanId,
      planStatus: "active",
      planName: getPlan(defaultPlanId).name,
      subscribed: false,
      endsAt: null,
      hasBillingHistory: false,
    }
  }

  const [row] = await authDb
    .select({
      planId: organization.planId,
      planStatus: organization.planStatus,
      stripeSubscriptionId: organization.stripeSubscriptionId,
      stripeCustomerId: organization.stripeCustomerId,
    })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  const planId = row && isValidPlanId(row.planId) ? row.planId : defaultPlanId
  const [sub] = row?.stripeSubscriptionId
    ? await authDb
        .select({
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          cancelAt: subscription.cancelAt,
          periodEnd: subscription.periodEnd,
        })
        .from(subscription)
        .where(eq(subscription.stripeSubscriptionId, row.stripeSubscriptionId))
        .limit(1)
    : []

  return {
    organizationId: orgId,
    planId,
    planStatus: row?.planStatus ?? "active",
    planName: getPlan(planId).name,
    subscribed: !!row?.stripeSubscriptionId,
    endsAt: sub?.cancelAt ?? (sub?.cancelAtPeriodEnd ? sub.periodEnd : null),
    hasBillingHistory: !!row?.stripeCustomerId,
  }
}

export { countTeamSeats } from "@prood/auth/membership"
export { domainLimitMessage, seatLimitMessage } from "./plan-usage"

/**
 * `BILLING_MODE` is set to the same value on apps/api, which turns billing off
 * when it doesn't match its Stripe key. Unset means plans can't be bought.
 */
export type BillingMode = "test" | "live"

export function billingMode(): BillingMode | null {
  const mode = process.env.BILLING_MODE?.trim()
  return mode === "test" || mode === "live" ? mode : null
}

/** The same rule apps/api enforces when Checkout or the billing page is opened. */
export async function canBuyPlans(mode: BillingMode | null): Promise<boolean> {
  if (!mode) return false
  const [memberRole, user] = await Promise.all([getActiveMemberRole(), getCurrentUser()])
  return canChangePlan({ memberRole, userRole: user?.role, testMode: mode === "test" })
}
