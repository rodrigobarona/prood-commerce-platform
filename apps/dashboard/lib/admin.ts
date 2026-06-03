import "server-only"
import { getAdmin, withTenant } from "@prood/commerce"
import { getActiveOrganizationId } from "@/lib/auth"

type Admin = Awaited<ReturnType<typeof getAdmin>>

/** The active organization id, or throw if none is resolvable. */
export async function requireActiveOrg(): Promise<string> {
  const orgId = await getActiveOrganizationId()
  if (!orgId) {
    throw new Error("No active organization. Select or create a store.")
  }
  return orgId
}

/**
 * Run an admin operation scoped to the active organization (tenant).
 *
 * Wraps the call in `withTenant()` so every query runs inside a transaction
 * with `app.current_org_id` set — i.e. row-level security filters by store.
 */
export async function withActiveOrg<T>(
  fn: (admin: Admin) => Promise<T>
): Promise<T> {
  const orgId = await requireActiveOrg()
  const admin = await getAdmin()
  return withTenant(orgId, () => fn(admin))
}
