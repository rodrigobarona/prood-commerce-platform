import { eq } from "drizzle-orm"
import { defaultPlanId, defaultPlanStatus, type PaidPlanId, type PlanStatus } from "@prood/billing"
import { authDb } from "./db"
import { organization } from "./schema"

export type LivePlan = { plan: PaidPlanId; status: PlanStatus; stripeSubscriptionId: string }

/**
 * Writes what Stripe says a customer pays for onto its store's
 * `organization.planId`, which every limit reads. `live` is null when no
 * subscription is still collecting, and the store goes back to Free. Returns
 * false when no store has this customer.
 */
export async function setOrganizationPlan(stripeCustomerId: string, live: LivePlan | null): Promise<boolean> {
  const updated = await authDb
    .update(organization)
    .set(
      live
        ? { planId: live.plan, planStatus: live.status, stripeSubscriptionId: live.stripeSubscriptionId }
        : { planId: defaultPlanId, planStatus: defaultPlanStatus, stripeSubscriptionId: null }
    )
    .where(eq(organization.stripeCustomerId, stripeCustomerId))
    .returning({ id: organization.id })
  return updated.length > 0
}
