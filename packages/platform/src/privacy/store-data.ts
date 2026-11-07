// ---------------------------------------------------------------------------
// A store's data, as a whole: export it (GDPR Art. 20, EU Data Act switching)
// and delete it (GDPR Art. 17, closing a store).
// ---------------------------------------------------------------------------
//
// Both walk every table that has an `organization_id` column, so a table added
// later is covered without touching this file. Runs inside `withTenant()`, so
// row-level security keeps each call to one store.

import { eq, getTableColumns, getTableName, inArray, is, sql } from 'drizzle-orm'
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

export interface CustomerErasure {
  /** Customer rows removed: the profile, its saved addresses, wishlists and carts. */
  customer: boolean
  /** Orders whose contact details, addresses and notes were cleared. */
  ordersScrubbed: number
}

/**
 * Erases one shopper from one store (GDPR Art. 17, for the store as controller).
 * The profile, saved addresses, wishlists and open carts go. Orders are the
 * store's accounting records, so by default they stay as they are, only no longer
 * pointing at the shopper. With `scrubOrders` the shopper's email, delivery and
 * billing addresses and notes are cleared from them too, and the totals, items
 * and dates stay. All of it happens in one transaction, or none of it does.
 */
export async function eraseCustomer(
  organizationId: string,
  customerId: string,
  { scrubOrders }: { scrubOrders: boolean },
): Promise<CustomerErasure> {
  return withTenant(organizationId, async () => {
    const db = getDb()
    const [customer] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.id, customerId))
    if (!customer) return { customer: false, ordersScrubbed: 0 }

    let ordersScrubbed = 0
    if (scrubOrders) {
      const orders = await db
        .select({ id: schema.orders.id })
        .from(schema.orders)
        .where(eq(schema.orders.customerId, customerId))
      const orderIds = orders.map((order) => order.id)
      if (orderIds.length > 0) {
        await db
          .update(schema.orders)
          .set({ contactEmail: null, shippingAddress: null, billingAddress: null, note: null, updatedAt: new Date() })
          .where(inArray(schema.orders.id, orderIds))
        await db.update(schema.orderHistory).set({ note: null }).where(inArray(schema.orderHistory.orderId, orderIds))
        await db
          .update(schema.returns)
          .set({ customerNote: null, merchantNote: null })
          .where(inArray(schema.returns.orderId, orderIds))
      }
      ordersScrubbed = orderIds.length
    }

    // Carts and wishlists go with the shopper. Addresses cascade from the customer row.
    await db.delete(schema.carts).where(eq(schema.carts.customerId, customerId))
    await db.delete(schema.customers).where(eq(schema.customers.id, customerId))
    return { customer: true, ordersScrubbed }
  })
}
