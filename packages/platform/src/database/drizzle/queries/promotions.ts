// ---------------------------------------------------------------------------
// Drizzle: Promotions queries
// ---------------------------------------------------------------------------

import { eq, and } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

import type { LocalizedField } from '@prood/types'

export async function findActivePromotions() {
  const conditions: any[] = [eq(schema.promotions.isActive, true)]
  const orgFilter = tenantCondition(schema.promotions)
  if (orgFilter) conditions.push(orgFilter)
  return getDb().select().from(schema.promotions)
    .where(and(...conditions))
}

export async function findCouponByCode(code: string) {
  const orgFilter = tenantCondition(schema.coupons)
  const where = orgFilter ? and(eq(schema.coupons.code, code), orgFilter) : eq(schema.coupons.code, code)
  const [row] = await getDb().select().from(schema.coupons).where(where)
  return row ?? null
}

export async function findPromotionById(id: string) {
  const orgFilter = tenantCondition(schema.promotions)
  const where = orgFilter ? and(eq(schema.promotions.id, id), orgFilter) : eq(schema.promotions.id, id)
  const [row] = await getDb().select().from(schema.promotions).where(where)
  return row ?? null
}

export async function insertPromotion(data: {
  name: LocalizedField
  description?: LocalizedField | null
  discountType: string
  discountValue: number
  target: string
  startsAt: Date | string
  endsAt?: Date | string | null
  isActive?: boolean
}) {
  const id = crypto.randomUUID()
  const orgId = currentOrgId() ?? null
  await getDb().insert(schema.promotions).values({
    id,
    organizationId: orgId,
    name: data.name,
    description: data.description ?? null,
    discountType: data.discountType,
    discountValue: String(data.discountValue),
    target: data.target,
    startsAt: data.startsAt instanceof Date ? data.startsAt : new Date(data.startsAt),
    endsAt: data.endsAt ? (data.endsAt instanceof Date ? data.endsAt : new Date(data.endsAt)) : null,
    isActive: data.isActive ?? true,
  } as any)
  return id
}
