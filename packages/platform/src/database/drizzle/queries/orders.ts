// ---------------------------------------------------------------------------
// Drizzle: Order queries
// ---------------------------------------------------------------------------

import { eq, and, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'

export async function createOrder(data: Record<string, any>) {
  const orgId = requireOrgId()
  await getDb().insert(schema.orders).values({ ...data, organizationId: orgId } as any)
}

export async function createOrderItem(data: Record<string, any>) {
  const orgId = requireOrgId()
  await getDb().insert(schema.orderItems).values({ ...data, organizationId: orgId } as any)
}

export async function createOrderHistory(data: Record<string, any>) {
  const orgId = requireOrgId()
  await getDb().insert(schema.orderHistory).values({ ...data, organizationId: orgId } as any)
}

export async function findOrderById(orderId: string) {
  const [row] = await getDb().select().from(schema.orders)
    .where(and(eq(schema.orders.id, orderId), tenantCondition(schema.orders)))
  return row ?? null
}

export async function findOrders(opts: { limit: number; offset: number; customerId?: string }) {
  const conditions: any[] = [tenantCondition(schema.orders)]
  if (opts.customerId) conditions.push(eq(schema.orders.customerId, opts.customerId))

  return getDb().select().from(schema.orders)
    .where(and(...conditions))
    .orderBy(desc(schema.orders.createdAt))
    .limit(opts.limit)
    .offset(opts.offset)
}

export async function countOrdersForCustomer(customerId: string) {
  const rows = await getDb()
    .select({ id: schema.orders.id })
    .from(schema.orders)
    .where(and(eq(schema.orders.customerId, customerId), tenantCondition(schema.orders)))
  return rows.length
}

export async function findOrderItems(orderId: string) {
  return getDb().select().from(schema.orderItems)
    .where(and(eq(schema.orderItems.orderId, orderId), tenantCondition(schema.orderItems)))
}

export async function findOrderHistory(orderId: string) {
  return getDb().select().from(schema.orderHistory)
    .where(and(eq(schema.orderHistory.orderId, orderId), tenantCondition(schema.orderHistory)))
    .orderBy(desc(schema.orderHistory.createdAt))
}

export async function updateOrder(orderId: string, data: Record<string, any>) {
  await getDb().update(schema.orders).set(data as any)
    .where(and(eq(schema.orders.id, orderId), tenantCondition(schema.orders)))
}
