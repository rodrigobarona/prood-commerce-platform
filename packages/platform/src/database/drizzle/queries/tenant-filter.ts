// ---------------------------------------------------------------------------
// Shared application-level tenant filter (defense-in-depth)
//
// Neon's default database role has BYPASSRLS, which silently skips all
// row-level-security policies. This helper adds an explicit WHERE clause
// for organization_id so queries are always scoped to the active tenant.
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
