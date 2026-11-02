"use server"

import { getEntitlements } from "@prood/billing"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"
import { countTeamSeats, getActiveOrganizationPlan, seatLimitMessage } from "@/lib/billing"

/** Pre-flight check before Better Auth sends the invitation email. */
export async function assertTeamSeatAvailableAction(): Promise<{ error?: string }> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }
  const orgId = await requireStoreAdmin()
  const plan = await getActiveOrganizationPlan()
  const limits = getEntitlements(plan?.planId ?? "free")

  const seatsUsed = await countTeamSeats(orgId)
  if (limits.maxTeamSeats !== null && seatsUsed >= limits.maxTeamSeats) {
    return { error: seatLimitMessage(limits.maxTeamSeats) }
  }

  return {}
}
