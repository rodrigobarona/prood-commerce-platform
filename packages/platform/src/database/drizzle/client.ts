// ---------------------------------------------------------------------------
// Database client (Drizzle + Neon serverless WebSocket Pool)
// ---------------------------------------------------------------------------
//
// Uses the WebSocket-based Pool driver (not neon-http) because multi-tenant
// row-level security needs a *session-bound* connection: each tenant-scoped
// request runs inside a transaction that sets `app.current_org_id`, and every
// query in that request must execute on the same connection. neon-http is
// stateless per query and cannot carry that session variable.

import { AsyncLocalStorage } from 'node:async_hooks'
import { Pool } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import { sql } from 'drizzle-orm'
import * as schema from './schema/index.js'

export type DrizzleDatabase = ReturnType<typeof drizzle<typeof schema>>

/** A transaction handle, shaped like the database for query reuse. */
type DrizzleTx = Parameters<Parameters<DrizzleDatabase['transaction']>[0]>[0]

// Module-level database instance — set via initDrizzle()
let _pool: Pool | null = null
let _db: DrizzleDatabase | null = null

// Per-request tenant context. When set, getDb() returns the transaction handle
// bound to the tenant connection so RLS policies see `app.current_org_id`.
const tenantStore = new AsyncLocalStorage<{ db: DrizzleTx; organizationId: string }>()

/**
 * Initialize the Drizzle database with a Neon serverless WebSocket Pool.
 *
 * @param connectionString - PostgreSQL connection string (e.g. from Neon)
 */
export function initDrizzle(connectionString: string): DrizzleDatabase {
  if (_db) return _db

  _pool = new Pool({ connectionString })
  _db = drizzle({ client: _pool, schema })
  return _db
}

/** Get the base (non-tenant-scoped) database instance. Throws if uninitialized. */
function getBaseDb(): DrizzleDatabase {
  if (!_db) {
    throw new Error(
      'Drizzle database not initialized. Call initDrizzle(connectionString) first.',
    )
  }
  return _db
}

/**
 * Get the database for the current execution context.
 *
 * Inside `withTenant()`, this returns the tenant-bound transaction handle so
 * every query runs on the connection that has `app.current_org_id` set (RLS).
 * Outside a tenant scope, it returns the base pool database.
 */
export function getDb(): DrizzleDatabase {
  const scoped = tenantStore.getStore()
  if (scoped) return scoped.db as unknown as DrizzleDatabase
  return getBaseDb()
}

/**
 * Run `fn` with all queries scoped to a tenant (organization).
 *
 * Opens a transaction, sets the `app.current_org_id` session variable (local to
 * the transaction) so RLS policies filter rows by organization, and exposes the
 * transaction handle to `getDb()` via AsyncLocalStorage. Every query issued
 * inside `fn` automatically runs on that connection.
 */
export async function withTenant<T>(
  organizationId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const base = getBaseDb()
  return base.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.current_org_id', ${organizationId}, true)`,
    )
    return tenantStore.run({ db: tx, organizationId }, fn)
  })
}

/** Active organization id when running inside `withTenant()`. */
export function getCurrentOrganizationId(): string | undefined {
  return tenantStore.getStore()?.organizationId
}

/** @deprecated Prefer getCurrentOrganizationId() */
export function currentTenantScope(): boolean {
  return tenantStore.getStore() !== undefined
}

/** Reset the database singleton without closing the pool (for tests). */
export function resetDb(): void {
  _pool = null
  _db = null
}

/** Close the pool and reset the singleton (for test teardown). */
export async function closeDrizzle(): Promise<void> {
  if (_pool) {
    await _pool.end()
  }
  _pool = null
  _db = null
}
