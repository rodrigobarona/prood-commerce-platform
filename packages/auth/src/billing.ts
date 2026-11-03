import { desc, eq } from "drizzle-orm"
import { defaultPlanId, defaultPlanStatus, isLivePlanStatus, isValidPlanId } from "@prood/billing"
import { authDb } from "./db"
import { organization, subscription } from "./schema"

/**
 * Copies a store's live Stripe subscription onto `organization.planId`, which
 * is what every limit reads. With none live, the store is back on Free. Safe to
 * run any number of times: it only reads the subscription rows.
 */
export async function syncOrganizationPlan(organizationId: string): Promise<void> {
  const rows = await authDb
    .select({
      plan: subscription.plan,
      status: subscription.status,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    })
    .from(subscription)
    .where(eq(subscription.referenceId, organizationId))
    .orderBy(desc(subscription.periodStart))

  const live = rows.find((row) => isLivePlanStatus(row.status) && isValidPlanId(row.plan))

  await authDb
    .update(organization)
    .set(
      live
        ? { planId: live.plan, planStatus: live.status, stripeSubscriptionId: live.stripeSubscriptionId }
        : { planId: defaultPlanId, planStatus: defaultPlanStatus, stripeSubscriptionId: null }
    )
    .where(eq(organization.id, organizationId))
}
