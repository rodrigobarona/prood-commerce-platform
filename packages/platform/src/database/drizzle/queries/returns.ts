// ---------------------------------------------------------------------------
// Drizzle: Returns queries
// ---------------------------------------------------------------------------

import { eq, and } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

import type { LocalizedField } from '@prood/types'

export async function findReturnsByOrder(orderId: string) {
  const orgFilter = tenantCondition(schema.returns)
  const where = orgFilter ? and(eq(schema.returns.orderId, orderId), orgFilter) : eq(schema.returns.orderId, orderId)
  return getDb().select().from(schema.returns).where(where)
}

export async function findReturnById(returnId: string) {
  const orgFilter = tenantCondition(schema.returns)
  const where = orgFilter ? and(eq(schema.returns.id, returnId), orgFilter) : eq(schema.returns.id, returnId)
  const [row] = await getDb().select().from(schema.returns).where(where)
  return row ?? null
}

export async function findReturnItemsByReturn(returnId: string) {
  const orgFilter = tenantCondition(schema.returnItems)
  const where = orgFilter ? and(eq(schema.returnItems.returnId, returnId), orgFilter) : eq(schema.returnItems.returnId, returnId)
  return getDb().select().from(schema.returnItems).where(where)
}

export async function insertReturn(data: {
  orderId: string
  orderNumber: string
  customerNote?: string | null
}) {
  const id = crypto.randomUUID()
  const orgId = currentOrgId() ?? null
  await getDb().insert(schema.returns).values({
    id,
    organizationId: orgId,
    orderId: data.orderId,
    orderNumber: data.orderNumber,
    status: 'requested',
    customerNote: data.customerNote ?? null,
  } as any)
  return id
}

export async function insertReturnItem(data: {
  returnId: string
  orderItemId: string
  productId: string
  variantId?: string | null
  name: LocalizedField
  image?: string | null
  quantity: number
  reason: string
  reasonNote?: string | null
}) {
  const id = crypto.randomUUID()
  const orgId = currentOrgId() ?? null
  await getDb().insert(schema.returnItems).values({
    id,
    organizationId: orgId,
    returnId: data.returnId,
    orderItemId: data.orderItemId,
    productId: data.productId,
    variantId: data.variantId ?? null,
    name: data.name,
    image: data.image ?? null,
    quantity: data.quantity,
    reason: data.reason,
    reasonNote: data.reasonNote ?? null,
  } as any)
  return id
}

export async function updateReturnStatus(returnId: string, status: string) {
  const orgFilter = tenantCondition(schema.returns)
  const where = orgFilter ? and(eq(schema.returns.id, returnId), orgFilter) : eq(schema.returns.id, returnId)
  await getDb().update(schema.returns)
    .set({ status, updatedAt: new Date() })
    .where(where)
}
