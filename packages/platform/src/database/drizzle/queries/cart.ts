// ---------------------------------------------------------------------------
// Drizzle: Cart queries
// ---------------------------------------------------------------------------

import { eq, and, sql } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

export async function createCart(id: string, now?: string | Date) {
  const orgId = currentOrgId()
  const values: any = { id, organizationId: orgId ?? null }
  if (now) {
    const ts = now instanceof Date ? now : new Date(now)
    values.createdAt = ts
    values.updatedAt = ts
  }
  await getDb().insert(schema.carts).values(values)
}

export async function findCart(cartId: string) {
  const orgFilter = tenantCondition(schema.carts)
  const where = orgFilter ? and(eq(schema.carts.id, cartId), orgFilter) : eq(schema.carts.id, cartId)
  const [row] = await getDb().select().from(schema.carts).where(where)
  return row ?? null
}

export async function findCartItems(cartId: string) {
  const orgFilter = tenantCondition(schema.cartItems)
  const where = orgFilter ? and(eq(schema.cartItems.cartId, cartId), orgFilter) : eq(schema.cartItems.cartId, cartId)
  return getDb().select().from(schema.cartItems).where(where)
}

export async function findExistingCartItem(cartId: string, productId: string, variantId?: string | null) {
  const conditions: any[] = [
    eq(schema.cartItems.cartId, cartId),
    eq(schema.cartItems.productId, productId),
    variantId
      ? eq(schema.cartItems.variantId, variantId)
      : sql`${schema.cartItems.variantId} IS NULL`,
  ]
  const orgFilter = tenantCondition(schema.cartItems)
  if (orgFilter) conditions.push(orgFilter)
  const [existing] = await getDb().select().from(schema.cartItems)
    .where(and(...conditions))
  return existing ?? null
}

export async function insertCartItem(item: {
  cartId: string
  productId: string
  variantId?: string | null
  quantity: number
  createdAt?: string | Date
}) {
  const orgId = currentOrgId()
  const values: any = {
    cartId: item.cartId,
    productId: item.productId,
    variantId: item.variantId ?? null,
    quantity: item.quantity,
    organizationId: orgId ?? null,
  }
  if (item.createdAt) {
    values.createdAt = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt)
  }
  await getDb().insert(schema.cartItems).values(values)
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  const orgFilter = tenantCondition(schema.cartItems)
  const where = orgFilter ? and(eq(schema.cartItems.id, itemId), orgFilter) : eq(schema.cartItems.id, itemId)
  await getDb().update(schema.cartItems).set({ quantity }).where(where)
}

export async function deleteCartItem(itemId: string) {
  const orgFilter = tenantCondition(schema.cartItems)
  const where = orgFilter ? and(eq(schema.cartItems.id, itemId), orgFilter) : eq(schema.cartItems.id, itemId)
  await getDb().delete(schema.cartItems).where(where)
}

export async function updateCart(cartId: string, data: Record<string, any>) {
  const orgFilter = tenantCondition(schema.carts)
  const where = orgFilter ? and(eq(schema.carts.id, cartId), orgFilter) : eq(schema.carts.id, cartId)
  await getDb().update(schema.carts).set(data).where(where)
}

export async function deleteCart(cartId: string) {
  const orgFilter = tenantCondition(schema.carts)
  const where = orgFilter ? and(eq(schema.carts.id, cartId), orgFilter) : eq(schema.carts.id, cartId)
  await getDb().delete(schema.carts).where(where)
}

export { findProductById } from './catalog.js'

export async function findVariantById(variantId: string) {
  const orgFilter = tenantCondition(schema.productVariants)
  const where = orgFilter ? and(eq(schema.productVariants.id, variantId), orgFilter) : eq(schema.productVariants.id, variantId)
  const [row] = await getDb().select().from(schema.productVariants).where(where)
  return row ?? null
}

export async function findPrimaryImage(productId: string) {
  const orgFilter = tenantCondition(schema.productImages)
  const conditions: any[] = [eq(schema.productImages.productId, productId), eq(schema.productImages.isPrimary, true)]
  if (orgFilter) conditions.push(orgFilter)
  const [row] = await getDb().select().from(schema.productImages)
    .where(and(...conditions))
    .limit(1)
  return row ?? null
}
