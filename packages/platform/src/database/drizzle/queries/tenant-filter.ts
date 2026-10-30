// ---------------------------------------------------------------------------
// Shared application-level tenant filter (defense in depth)
//
// Row-level security already scopes every query inside `withTenant()` (it runs
// as the `prood_app` role). This helper adds an explicit WHERE clause for
// organization_id as well, so a policy mistake cannot leak rows on its own.
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getCurrentOrganizationId } from '../client.js'

/** Returns the current org id or throws if not inside `withTenant()`. */
export function requireOrgId(): string {
  const orgId = getCurrentOrganizationId()
  if (!orgId) throw new Error('No active organization scope — wrap the call in withTenant()')
  return orgId
}

/**
 * Returns an `eq(table.organizationId, currentOrgId)` condition.
 * Throws if called outside `withTenant()`.
 */
export function tenantCondition(table: { organizationId: any }) {
  return eq(table.organizationId, requireOrgId())
}
