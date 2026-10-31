// ---------------------------------------------------------------------------
// Drizzle: Order queries
// ---------------------------------------------------------------------------

import { count, eq, and, desc, inArray, or, sql, ne } from 'drizzle-orm'
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
 * Update an order only while its payment status is one of `fromPaymentStatuses`.
 * A single conditional UPDATE, so concurrent webhook deliveries cannot both win.
 * Returns whether a row changed.
 */
export async function transitionOrderPayment(
  orderId: string,
  fromPaymentStatuses: string[],
  expectedStatus: string,
  data: Record<string, any>,
): Promise<boolean> {
  const rows = await getDb().update(schema.orders).set(data as any)
    .where(and(
      eq(schema.orders.id, orderId),
      tenantCondition(schema.orders),
      inArray(schema.orders.paymentStatus, fromPaymentStatuses),
      eq(schema.orders.status, expectedStatus),
    ))
    .returning({ id: schema.orders.id })
  return rows.length > 0
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
  const [row] = await getDb()
    .select({ count: count() })
    .from(schema.orders)
    .where(and(eq(schema.orders.customerId, customerId), tenantCondition(schema.orders)))
  return row?.count ?? 0
}

/**
 * Orders by one shopper, known by customer id or contact email: every guest
 * checkout makes a new customer, so the email is what repeats.
 */
export async function countOrdersByShopper(
  shopper: { customerId?: string | null; contactEmail?: string | null },
  couponCode?: string,
) {
  const [row] = await getDb()
    .select({ count: count() })
    .from(schema.orders)
    .where(and(
      or(
        shopper.customerId ? eq(schema.orders.customerId, shopper.customerId) : undefined,
        shopper.contactEmail
          ? sql`lower(${schema.orders.contactEmail}) = lower(${shopper.contactEmail})`
          : undefined,
      ),
      couponCode ? eq(schema.orders.couponCode, couponCode) : undefined,
      ne(schema.orders.status, 'cancelled'),
      tenantCondition(schema.orders),
    ))
  return row?.count ?? 0
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
