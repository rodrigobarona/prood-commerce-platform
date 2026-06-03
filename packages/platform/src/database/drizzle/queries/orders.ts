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

/**
 * Look up the organization that owns an order (cross-tenant, unscoped).
 * Used by the webhook handler to resolve tenant when ?org is missing.
 */
export async function findOrderOrgId(orderId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ organizationId: schema.orders.organizationId })
    .from(schema.orders)
    .where(eq(schema.orders.id, orderId))
  return row?.organizationId ?? null
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
