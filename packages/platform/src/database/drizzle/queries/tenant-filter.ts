// ---------------------------------------------------------------------------
// Shared application-level tenant filter (defense-in-depth)
//
// Neon's default database role has BYPASSRLS, which silently skips all
// row-level-security policies. This helper adds an explicit WHERE clause
// for organization_id so queries are always scoped to the active tenant.
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getCurrentOrganizationId } from '../client.js'

/**
 * Returns an `eq(table.organizationId, currentOrgId)` condition when inside
 * `withTenant()`, or `undefined` outside a tenant scope (legacy/unscoped).
 */
export function tenantCondition(table: { organizationId: any }) {
  const orgId = getCurrentOrganizationId()
  return orgId ? eq(table.organizationId, orgId) : undefined
}

/** Returns the current org id or null. Re-exported for raw SQL queries. */
export function currentOrgId(): string | undefined {
  return getCurrentOrganizationId()
}
