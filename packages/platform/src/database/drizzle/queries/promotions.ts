// ---------------------------------------------------------------------------
// Drizzle: Promotions queries
// ---------------------------------------------------------------------------

import { eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function findActivePromotions() {
  return getDb().select().from(schema.promotions)
    .where(eq(schema.promotions.isActive, true))
}

export async function findCouponByCode(code: string) {
  const [row] = await getDb().select().from(schema.coupons)
    .where(eq(schema.coupons.code, code))
  return row ?? null
}

export async function findPromotionById(id: string) {
  const [row] = await getDb().select().from(schema.promotions)
    .where(eq(schema.promotions.id, id))
  return row ?? null
}

import type { LocalizedField } from '@prood/types'

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
  await getDb().insert(schema.promotions).values({
    id,
    name: data.name,
    description: data.description ?? null,
    discountType: data.discountType,
    discountValue: String(data.discountValue),
    target: data.target,
    startsAt: data.startsAt instanceof Date ? data.startsAt : new Date(data.startsAt),
    endsAt: data.endsAt ? (data.endsAt instanceof Date ? data.endsAt : new Date(data.endsAt)) : null,
    isActive: data.isActive ?? true,
  })
  return id
}
