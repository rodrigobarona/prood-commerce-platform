// ---------------------------------------------------------------------------
// Drizzle: Admin order queries
// ---------------------------------------------------------------------------

import { count, eq, sql, and, inArray, like, gte, lte, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition } from './tenant-filter.js'

export async function countOrders(): Promise<number> {
  const result = await getDb().select({ count: count() }).from(schema.orders)
    .where(tenantCondition(schema.orders))
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
}) {
  const db = getDb()
  const conditions: any[] = [tenantCondition(schema.orders)]

  if (opts.status) conditions.push(eq(schema.orders.status, opts.status as any))
  if (opts.customerId) conditions.push(eq(schema.orders.customerId, opts.customerId))
  if (opts.dateFrom) conditions.push(gte(schema.orders.createdAt, new Date(opts.dateFrom)))
  if (opts.dateTo) conditions.push(lte(schema.orders.createdAt, new Date(opts.dateTo)))
  if (opts.search) conditions.push(like(schema.orders.orderNumber, `%${opts.search}%`))

  const where = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.orders)
      .where(where)
      .orderBy(desc(schema.orders.createdAt))
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
 * Money received: orders still paid or only partly refunded, so a full refund
 * takes its order back out. A partial refund's amount is not recorded on the
 * order, so such an order still counts at its full total.
 */
export async function sumOrderRevenue() {
  const [result] = await getDb()
    .select({ total: sql`COALESCE(SUM(total), 0)`.mapWith(Number) })
    .from(schema.orders)
    .where(and(inArray(schema.orders.paymentStatus, ['paid', 'partially_refunded']), tenantCondition(schema.orders)))
  return result?.total ?? 0
}

export async function findRecentOrders(limit: number) {
  return getDb().select().from(schema.orders)
    .where(tenantCondition(schema.orders))
    .orderBy(desc(schema.orders.createdAt))
    .limit(limit)
}
