// ---------------------------------------------------------------------------
// A store's data, as a whole: export it (GDPR Art. 20, EU Data Act switching)
// and delete it (GDPR Art. 17, closing a store).
// ---------------------------------------------------------------------------
//
// Both walk every table that has an `organization_id` column, so a table added
// later is covered without touching this file. Runs inside `withTenant()`, so
// row-level security keeps each call to one store.

import { eq, getTableColumns, getTableName, is, sql } from 'drizzle-orm'
import { PgTable } from 'drizzle-orm/pg-core'
import { getDb, withTenant } from '../database/drizzle/client.js'
import * as schema from '../database/drizzle/schema/index.js'

const tenantTables = (Object.values(schema) as unknown[]).filter(
  (value): value is PgTable => is(value, PgTable) && 'organizationId' in getTableColumns(value),
)

/**
 * Tables that hold other tables' parents, in the order that clears them. Rows
 * that depend on these go with them through `ON DELETE CASCADE`. Anything not
 * listed is cleared afterwards, and the check at the end fails the whole
 * deletion if a row is left.
 */
const DELETE_FIRST = [
  'carts',
  'orders',
  'returns',
  'wishlists',
  'reviews',
  'customers',
  'coupons',
  'promotions',
  'products',
  'categories',
  'brands',
]

/** Every row the store owns, by table name. Payment provider credentials are not here: they never leave the server. */
export async function exportStoreData(organizationId: string): Promise<Record<string, unknown[]>> {
  return withTenant(organizationId, async () => {
    const db = getDb()
    const out: Record<string, unknown[]> = {}
    for (const table of tenantTables) {
      out[getTableName(table)] = await db.select().from(table)
    }
    return out
  })
}

/** Deletes every row the store owns, or none. Returns the number of rows removed per table. */
export async function deleteStoreData(organizationId: string): Promise<Record<string, number>> {
  return withTenant(organizationId, async () => {
    const db = getDb()
    const byName = new Map(tenantTables.map((table) => [getTableName(table), table]))
    const order = [
      ...DELETE_FIRST.flatMap((name) => byName.get(name) ?? []),
      ...tenantTables.filter((table) => !DELETE_FIRST.includes(getTableName(table))),
    ]
    const before: Record<string, number> = {}
    for (const table of tenantTables) {
      const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table)
      before[getTableName(table)] = row?.n ?? 0
    }
    for (const table of order) await db.delete(table)

    for (const table of tenantTables) {
      const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(table)
      if (row?.n) throw new Error(`Store data was left behind in ${getTableName(table)}; nothing was deleted.`)
    }
    return before
  })
}

/**
 * Removes the link between a sign-in account and the customer rows it was
 * attached to, in every store. The stores keep their orders and contact
 * details, which are theirs; they just stop pointing at an account that no
 * longer exists. Runs across stores, so call it outside `withTenant()`.
 */
export async function unlinkAuthUserFromCustomers(authUserId: string): Promise<number> {
  const rows = await getDb()
    .update(schema.customers)
    .set({ authUserId: null, updatedAt: new Date() })
    .where(eq(schema.customers.authUserId, authUserId))
    .returning({ id: schema.customers.id })
  return rows.length
}
