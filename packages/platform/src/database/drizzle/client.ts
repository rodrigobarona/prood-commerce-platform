// ---------------------------------------------------------------------------
// Database client (Drizzle + Neon serverless WebSocket Pool)
// ---------------------------------------------------------------------------
//
// Uses the WebSocket-based Pool driver (not neon-http) because multi-tenant
// row-level security needs a *session-bound* connection: each tenant-scoped
// request runs inside a transaction that sets `app.current_org_id` and
// switches to the `prood_app` role, and every query in that request must
// execute on the same connection. neon-http is stateless per query and cannot
// carry that state.

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
// bound to the tenant connection, where RLS policies apply.
const tenantStore = new AsyncLocalStorage<{ db: DrizzleTx; organizationId: string }>()

/**
 * Initialize the Drizzle database with a Neon serverless WebSocket Pool.
 *
 * @param connectionString - PostgreSQL connection string (e.g. from Neon)
 */
export function initDrizzle(connectionString: string): DrizzleDatabase {
  if (_db) return _db

  _pool = new Pool({ connectionString })
  // Without a listener, one dropped idle connection (Neon suspending, a network
  // blip) is an uncaught error that kills the process. The pool replaces it.
  _pool.on('error', (err: Error) => console.error('[db] idle connection lost', err))
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
 * every query runs through RLS as `prood_app`. Outside a tenant scope, it
 * returns the base pool database (connecting role, cross-tenant).
 */
export function getDb(): DrizzleDatabase {
  const scoped = tenantStore.getStore()
  if (scoped) return scoped.db as unknown as DrizzleDatabase
  return getBaseDb()
}

/**
 * Run `fn` with all queries scoped to a tenant (organization).
 *
 * Opens a transaction, sets the `app.current_org_id` setting and switches to
 * the `prood_app` role (both local to the transaction), and exposes the
 * transaction handle to `getDb()` via AsyncLocalStorage. Every query issued
 * inside `fn` runs on that connection as `prood_app`, which has DML grants but
 * no BYPASSRLS, so the `tenant_isolation` policies filter every read and
 * reject writes for any other organization.
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
    await tx.execute(sql`set local role prood_app`)
    return tenantStore.run({ db: tx, organizationId }, fn)
  })
}

/** Active organization id when running inside `withTenant()`. */
export function getCurrentOrganizationId(): string | undefined {
  return tenantStore.getStore()?.organizationId
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
