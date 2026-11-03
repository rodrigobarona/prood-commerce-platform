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
import { organization } from "./auth/schema"

export type OrganizationPlanSnapshot = {
  organizationId: string
  planId: PlanId
  planStatus: string
  planName: string
  /** Billed through Stripe. A plan set by hand in admin has no subscription. */
  subscribed: boolean
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
    }
  }

  const [row] = await authDb
    .select({
      planId: organization.planId,
      planStatus: organization.planStatus,
      stripeSubscriptionId: organization.stripeSubscriptionId,
    })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  const planId = row && isValidPlanId(row.planId) ? row.planId : defaultPlanId

  return {
    organizationId: orgId,
    planId,
    planStatus: row?.planStatus ?? "active",
    planName: getPlan(planId).name,
    subscribed: !!row?.stripeSubscriptionId,
  }
}

export { countTeamSeats } from "@prood/auth/membership"
export { domainLimitMessage, seatLimitMessage } from "./plan-usage"

/**
 * `BILLING_MODE` mirrors the key apps/api bills with: "test" for a Stripe test
 * key, "live" for a live one. Unset means plans can't be bought.
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

export { syncOrganizationPlan } from "@prood/auth/billing"
