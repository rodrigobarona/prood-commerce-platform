"use server"

import { and, count, eq } from "drizzle-orm"
import { getEntitlements } from "@prood/billing"
import { assertLimit } from "@prood/commerce"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"
import { getActiveOrganizationPlan } from "@/lib/billing"
import { authDb } from "@/lib/auth/db"
import { invitation, member } from "@/lib/auth/schema"

/** Pre-flight check before Better Auth sends the invitation email. */
export async function assertTeamSeatAvailableAction(): Promise<{ error?: string }> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }
  const orgId = await requireStoreAdmin()
  const plan = await getActiveOrganizationPlan()
  const limits = getEntitlements(plan?.planId ?? "free")

  const [memberRow] = await authDb
    .select({ value: count() })
    .from(member)
    .where(eq(member.organizationId, orgId))

  const [pendingRow] = await authDb
    .select({ value: count() })
    .from(invitation)
    .where(
      and(
        eq(invitation.organizationId, orgId),
        eq(invitation.status, "pending"),
      ),
    )

  const seatsUsed = Number(memberRow?.value ?? 0) + Number(pendingRow?.value ?? 0)
  try {
    assertLimit(
      seatsUsed,
      limits.maxTeamSeats,
      "Team seat limit reached for your plan. Upgrade to invite more members.",
    )
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Team seat limit reached" }
  }

  return {}
}
