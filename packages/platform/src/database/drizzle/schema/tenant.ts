// ---------------------------------------------------------------------------
// Tenant isolation — shared column, role, and RLS policy for tenant tables
// ---------------------------------------------------------------------------
//
// Every tenant-owned table has an `organization_id` column and a
// `tenant_isolation` policy for the `prood_app` role. `withTenant()` sets
// `app.current_org_id` and then `SET LOCAL ROLE prood_app`, so every query in
// a tenant scope runs through these policies. The role itself (NOLOGIN,
// NOBYPASSRLS, DML grants) is created by the `0000_app_role` migration.

import { sql } from 'drizzle-orm'
import { pgPolicy, pgRole, text } from 'drizzle-orm/pg-core'

/** Non-login, non-bypass role that tenant-scoped transactions switch to. */
export const proodApp = pgRole('prood_app').existing()

/** Active tenant of the current transaction, or NULL outside `withTenant()`. */
const currentOrgId = sql`nullif(current_setting('app.current_org_id', true), '')`

/**
 * Tenant column. Defaults to the active tenant so inserts inside `withTenant()`
 * are tagged automatically; outside a tenant scope the default is NULL and the
 * insert fails instead of creating an unowned row.
 */
export const organizationId = () =>
  text('organization_id').notNull().default(currentOrgId)

/** Rows are visible and writable only for the active tenant. */
export const tenantIsolation = () =>
  pgPolicy('tenant_isolation', {
    as: 'permissive',
    for: 'all',
    to: proodApp,
    using: sql`organization_id = ${currentOrgId}`,
    withCheck: sql`organization_id = ${currentOrgId}`,
  })
