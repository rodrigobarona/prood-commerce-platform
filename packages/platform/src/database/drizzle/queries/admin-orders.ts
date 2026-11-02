// ---------------------------------------------------------------------------
// Drizzle: Admin order queries
// ---------------------------------------------------------------------------

import { asc, count, eq, sql, and, or, inArray, ilike, gte, lt, lte, desc, type AnyColumn } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition } from './tenant-filter.js'
import { contains, SETTLED_PAYMENTS, type OrderQueue } from '@prood/types'

export async function countOrders(): Promise<number> {
  const result = await getDb().select({ count: count() }).from(schema.orders)
    .where(tenantCondition(schema.orders))
  return result[0]?.count ?? 0
}

/**
 * Orders that reached paid, whatever happened next: a refund doesn't undo the
 * payment having worked. Free orders never touch a payment provider.
 */
export async function countPaidOrders(): Promise<number> {
  const result = await getDb()
    .select({ count: count() })
    .from(schema.orders)
    .where(and(
      inArray(schema.orders.paymentStatus, ['paid', 'partially_refunded', 'refunded']),
      tenantCondition(schema.orders),
    ))
  return result[0]?.count ?? 0
}

export async function countOrdersThisMonth(): Promise<number> {
  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const result = await getDb()
    .select({ count: count() })
    .from(schema.orders)
    .where(and(gte(schema.orders.createdAt, monthStart), tenantCondition(schema.orders)))
  return result[0]?.count ?? 0
}

export async function adminFindAllOrders(opts: {
  limit: number
  offset: number
  status?: string
  customerId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  awaitingPaymentFrom?: string
  queue?: OrderQueue
  sort?: { field: string; direction: 'asc' | 'desc' }
}) {
  const db = getDb()
  const conditions: any[] = [tenantCondition(schema.orders)]

  if (opts.status) conditions.push(eq(schema.orders.status, opts.status as any))
  if (opts.customerId) conditions.push(eq(schema.orders.customerId, opts.customerId))
  if (opts.dateFrom) conditions.push(gte(schema.orders.createdAt, new Date(opts.dateFrom)))
  if (opts.dateTo) conditions.push(lte(schema.orders.createdAt, new Date(opts.dateTo)))
  if (opts.search) {
    const pattern = contains(opts.search)
    const buyer = (address: AnyColumn) =>
      sql`concat_ws(' ', ${address}->>'firstName', ${address}->>'lastName') ILIKE ${pattern}`
    conditions.push(or(
      ilike(schema.orders.orderNumber, pattern),
      ilike(schema.orders.contactEmail, pattern),
      buyer(schema.orders.shippingAddress),
      buyer(schema.orders.billingAddress),
    ))
  }
  if (opts.queue) {
    conditions.push(inArray(schema.orders.status, ['placed', 'approved']))
    if (opts.queue === 'to_fulfill') {
      conditions.push(
        inArray(schema.orders.paymentStatus, [...SETTLED_PAYMENTS]),
        eq(schema.orders.fulfillmentStatus, 'unfulfilled'),
      )
    }
  }
  if (opts.awaitingPaymentFrom) {
    conditions.push(
      eq(schema.orders.paymentProvider, opts.awaitingPaymentFrom),
      eq(schema.orders.status, 'placed'),
      inArray(schema.orders.paymentStatus, ['unpaid', 'authorized']),
    )
  }

  const where = and(...conditions)
  const sortColumn = opts.sort?.field === 'total' ? schema.orders.total : schema.orders.createdAt
  const order = opts.sort?.direction === 'asc' ? asc : desc

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.orders)
      .where(where)
      .orderBy(order(sortColumn), order(schema.orders.id))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ count: count() })
      .from(schema.orders)
      .where(where),
  ])

  return { rows, total: countResult[0]?.count ?? 0 }
}

export async function countOrdersByStatus() {
  const result = await getDb()
    .select({
      status: schema.orders.status,
      count: count(),
    })
    .from(schema.orders)
    .where(tenantCondition(schema.orders))
    .groupBy(schema.orders.status)

  const map: Record<string, number> = {}
  for (const row of result) {
    map[row.status] = row.count
  }
  return map
}

/**
 * Money received: orders still paid or only partly refunded, less their refunds
 * so far, so "Revenue received" is what the store kept.
 */
const KEPT_SUM = sql`COALESCE(SUM(${schema.orders.total} - (
  SELECT COALESCE(SUM(refund.value::numeric), 0) FROM jsonb_each_text(${schema.orders.refunds}) AS refund
)) FILTER (WHERE ${schema.orders.paymentStatus} IN ('paid', 'partially_refunded')), 0)`

export async function sumOrderRevenue() {
  const [result] = await getDb()
    .select({ total: KEPT_SUM.mapWith(Number) })
    .from(schema.orders)
    .where(tenantCondition(schema.orders))
  return result?.total ?? 0
}

/** Orders placed in `[from, to)` and what those orders brought in. Orders record no paid-at time. */
export async function orderActivityBetween(from: Date, to: Date) {
  const [result] = await getDb()
    .select({ orders: count(), revenue: KEPT_SUM.mapWith(Number) })
    .from(schema.orders)
    .where(and(gte(schema.orders.createdAt, from), lt(schema.orders.createdAt, to), tenantCondition(schema.orders)))
  return { orders: result?.orders ?? 0, revenue: result?.revenue ?? 0 }
}

export async function findRecentOrders(limit: number) {
  return getDb().select().from(schema.orders)
    .where(tenantCondition(schema.orders))
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit)
}
