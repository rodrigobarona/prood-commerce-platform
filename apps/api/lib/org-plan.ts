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
import { DEFAULT_LOCALE, type LocalizedField } from "@prood/types"

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

/** The sidebar and store switcher read the organization, so a store rename has to reach it. */
export async function renameOrganization(orgId: string, name: LocalizedField): Promise<void> {
  const next = name[DEFAULT_LOCALE] || Object.values(name)[0]
  if (!next) return
  await authDb.update(organization).set({ name: next }).where(eq(organization.id, orgId))
}
