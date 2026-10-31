import "server-only"
import { isStoreAdminRole } from "@prood/auth/membership"
import { getActiveMemberRole, getActiveOrganizationId } from "@/lib/auth"

export const ADMIN_ONLY_MESSAGE = "Only store owners and admins can do this."

/** The active organization id, or throw if none is resolvable. */
export async function requireActiveOrg(): Promise<string> {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    throw new Error("No active organization. Select or create a store.")
  }
  return orgId
}

/** Whether the current merchant may change the active store. */
export async function canManageStore(): Promise<boolean> {
  return isStoreAdminRole(await getActiveMemberRole())
}

/** The active organization id, or throw unless the merchant may change it. */
export async function requireStoreAdmin(): Promise<string> {
  const orgId = await requireActiveOrg()
  if (!(await canManageStore())) throw new Error(ADMIN_ONLY_MESSAGE)
  return orgId
}
