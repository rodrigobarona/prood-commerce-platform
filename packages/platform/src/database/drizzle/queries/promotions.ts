// ---------------------------------------------------------------------------
// Drizzle: Promotions queries
// ---------------------------------------------------------------------------

import { eq, and } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'

import type { LocalizedField } from '@prood/types'

export async function findActivePromotions() {
  return getDb().select().from(schema.promotions)
    .where(and(eq(schema.promotions.isActive, true), tenantCondition(schema.promotions)))
}

export async function findCouponByCode(code: string) {
  const [row] = await getDb().select().from(schema.coupons)
    .where(and(eq(schema.coupons.code, code), tenantCondition(schema.coupons)))
  return row ?? null
}

export async function findPromotionById(id: string) {
  const [row] = await getDb().select().from(schema.promotions)
    .where(and(eq(schema.promotions.id, id), tenantCondition(schema.promotions)))
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
  const orgId = requireOrgId()
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
