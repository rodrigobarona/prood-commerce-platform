import "server-only"
import { eq } from "drizzle-orm"
import {
  defaultPlanId,
  getEntitlements,
  isValidPlanId,
  type PlanId,
} from "@prood/billing"
import { authDb } from "@/lib/auth/db"
import { organization } from "@prood/auth/schema"

export async function getOrganizationPlanId(orgId: string): Promise<PlanId> {
  const [row] = await authDb
    .select({ planId: organization.planId })
    .from(organization)
    .where(eq(organization.id, orgId))
    .limit(1)

  if (row && isValidPlanId(row.planId)) return row.planId
  return defaultPlanId
}

export async function getOrganizationLimits(orgId: string) {
  return getEntitlements(await getOrganizationPlanId(orgId))
}
