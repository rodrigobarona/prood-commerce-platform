// ---------------------------------------------------------------------------
// Drizzle: Order queries
// ---------------------------------------------------------------------------

import { eq, and, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

export async function createOrder(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.orders).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function createOrderItem(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.orderItems).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function createOrderHistory(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.orderHistory).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function findOrderById(orderId: string) {
  const orgFilter = tenantCondition(schema.orders)
  const where = orgFilter ? and(eq(schema.orders.id, orderId), orgFilter) : eq(schema.orders.id, orderId)
  const [row] = await getDb().select().from(schema.orders).where(where)
  return row ?? null
}

export async function findOrders(opts: { limit: number; offset: number; customerId?: string }) {
  const db = getDb()
  const conditions: any[] = []
  const orgFilter = tenantCondition(schema.orders)
  if (orgFilter) conditions.push(orgFilter)
  if (opts.customerId) conditions.push(eq(schema.orders.customerId, opts.customerId))

  return db.select().from(schema.orders)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.orders.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)
}

export async function countOrdersForCustomer(customerId: string) {
  const orgFilter = tenantCondition(schema.orders)
  const where = orgFilter ? and(eq(schema.orders.customerId, customerId), orgFilter) : eq(schema.orders.customerId, customerId)
  const rows = await getDb()
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(where)
  return rows.length
}

export async function findOrderItems(orderId: string) {
  const orgFilter = tenantCondition(schema.orderItems)
  const where = orgFilter ? and(eq(schema.orderItems.orderId, orderId), orgFilter) : eq(schema.orderItems.orderId, orderId)
  return getDb().select().from(schema.orderItems).where(where)
}

export async function findOrderHistory(orderId: string) {
  const orgFilter = tenantCondition(schema.orderHistory)
  const where = orgFilter ? and(eq(schema.orderHistory.orderId, orderId), orgFilter) : eq(schema.orderHistory.orderId, orderId)
  return getDb().select().from(schema.orderHistory)
    .where(where)
    .orderBy(desc(schema.orderHistory.createdAt))
}

export async function updateOrder(orderId: string, data: Record<string, any>) {
  const orgFilter = tenantCondition(schema.orders)
  const where = orgFilter ? and(eq(schema.orders.id, orderId), orgFilter) : eq(schema.orders.id, orderId)
  await getDb().update(schema.orders).set(data as any).where(where)
}
