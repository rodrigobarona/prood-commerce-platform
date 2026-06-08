import "server-only"
import { getActiveOrganizationId } from "@/lib/auth"

/** The active organization id, or throw if none is resolvable. */
export async function requireActiveOrg(): Promise<string> {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    throw new Error("No active organization. Select or create a store.")
  }
  return orgId
}
