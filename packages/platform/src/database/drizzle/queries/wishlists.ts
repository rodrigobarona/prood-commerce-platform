// ---------------------------------------------------------------------------
// Drizzle: Wishlist queries
// ---------------------------------------------------------------------------

import { eq, and } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

export async function findWishlistByCustomer(customerId: string) {
  const orgFilter = tenantCondition(schema.wishlists)
  const where = orgFilter ? and(eq(schema.wishlists.customerId, customerId), orgFilter) : eq(schema.wishlists.customerId, customerId)
  const [row] = await getDb().select().from(schema.wishlists).where(where)
  return row ?? null
}

export async function createWishlist(customerId: string) {
  const id = crypto.randomUUID()
  const orgId = currentOrgId() ?? null
  await getDb().insert(schema.wishlists).values({ id, customerId, organizationId: orgId } as any)
  return { id, organizationId: orgId, customerId, createdAt: new Date() }
}

export async function findWishlistItems(wishlistId: string) {
  const orgFilter = tenantCondition(schema.wishlistItems)
  const where = orgFilter ? and(eq(schema.wishlistItems.wishlistId, wishlistId), orgFilter) : eq(schema.wishlistItems.wishlistId, wishlistId)
  return getDb().select().from(schema.wishlistItems).where(where)
}

export async function insertWishlistItem(data: {
  wishlistId: string
  productId: string
  variantId?: string | null
}) {
  const id = crypto.randomUUID()
  await getDb().insert(schema.wishlistItems).values({
    id,
    wishlistId: data.wishlistId,
    productId: data.productId,
    variantId: data.variantId ?? null,
  })
  return id
}

export async function deleteWishlistItem(wishlistId: string, productId: string) {
  const conditions: any[] = [
    eq(schema.wishlistItems.wishlistId, wishlistId),
    eq(schema.wishlistItems.productId, productId),
  ]
  const orgFilter = tenantCondition(schema.wishlistItems)
  if (orgFilter) conditions.push(orgFilter)
  await getDb().delete(schema.wishlistItems).where(and(...conditions))
}

export async function findWishlistItemByProduct(wishlistId: string, productId: string) {
  const conditions: any[] = [
    eq(schema.wishlistItems.wishlistId, wishlistId),
    eq(schema.wishlistItems.productId, productId),
  ]
  const orgFilter = tenantCondition(schema.wishlistItems)
  if (orgFilter) conditions.push(orgFilter)
  const [row] = await getDb().select().from(schema.wishlistItems).where(and(...conditions))
  return row ?? null
}
