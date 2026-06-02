// ---------------------------------------------------------------------------
// Drizzle: Admin catalog queries (products + categories write ops)
// ---------------------------------------------------------------------------

import { eq, sql, and, like, asc, desc, lte } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

// ---- Products ----

export async function countProducts(): Promise<number> {
  const orgFilter = tenantCondition(schema.products)
  const result = await getDb().select({ count: sql<number>`count(*)` }).from(schema.products)
    .where(orgFilter)
  return Number(result[0]?.count ?? 0)
}

export async function countActiveProducts(): Promise<number> {
  const orgFilter = tenantCondition(schema.products)
  const conditions = [eq(schema.products.status, 'active')]
  if (orgFilter) conditions.push(orgFilter)
  const result = await getDb().select({ count: sql<number>`count(*)` }).from(schema.products)
    .where(and(...conditions))
  return Number(result[0]?.count ?? 0)
}

export async function adminCreateProduct(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.products).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function adminUpdateProduct(id: string, data: Record<string, any>) {
  const orgFilter = tenantCondition(schema.products)
  const where = orgFilter ? and(eq(schema.products.id, id), orgFilter) : eq(schema.products.id, id)
  await getDb().update(schema.products).set(data as any).where(where)
}

export async function adminDeleteProduct(id: string) {
  const orgFilter = tenantCondition(schema.products)
  const where = orgFilter ? and(eq(schema.products.id, id), orgFilter) : eq(schema.products.id, id)
  await getDb().delete(schema.products).where(where)
}

export async function adminListProducts(opts: {
  limit: number
  offset: number
  search?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
  orderBy?: { field: string; direction: 'asc' | 'desc' }
}) {
  const db = getDb()
  const conditions: any[] = []

  const orgFilter = tenantCondition(schema.products)
  if (orgFilter) conditions.push(orgFilter)

  if (opts.search) {
    conditions.push(like(schema.products.name, `%${opts.search}%`))
  }

  const sorting = opts.orderBy || opts.sort
  const sortCol = sorting?.field === 'price' ? schema.products.price
    : sorting?.field === 'name' ? schema.products.name
    : schema.products.createdAt
  const orderFn = sorting?.direction === 'asc' ? asc : desc

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortCol))
      .limit(opts.limit)
      .offset(opts.offset),
    db.select({ count: sql<number>`count(*)` })
      .from(schema.products)
      .where(conditions.length > 0 ? and(...conditions) : undefined),
  ])

  return { rows, total: countResult[0]?.count ?? 0 }
}

// ---- Product relations ----

export async function adminCreateProductImage(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.productImages).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function adminDeleteProductImages(productId: string) {
  const orgFilter = tenantCondition(schema.productImages)
  const where = orgFilter ? and(eq(schema.productImages.productId, productId), orgFilter) : eq(schema.productImages.productId, productId)
  await getDb().delete(schema.productImages).where(where)
}

export async function adminCreateProductVariant(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.productVariants).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function adminDeleteProductVariants(productId: string) {
  const orgFilter = tenantCondition(schema.productVariants)
  const where = orgFilter ? and(eq(schema.productVariants.productId, productId), orgFilter) : eq(schema.productVariants.productId, productId)
  await getDb().delete(schema.productVariants).where(where)
}

export async function adminCreateProductAttribute(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.productAttributes).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function adminDeleteProductAttributes(productId: string) {
  const orgFilter = tenantCondition(schema.productAttributes)
  const where = orgFilter ? and(eq(schema.productAttributes.productId, productId), orgFilter) : eq(schema.productAttributes.productId, productId)
  await getDb().delete(schema.productAttributes).where(where)
}

export async function adminCreateProductTag(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.productTags).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function adminDeleteProductTags(productId: string) {
  const orgFilter = tenantCondition(schema.productTags)
  const where = orgFilter ? and(eq(schema.productTags.productId, productId), orgFilter) : eq(schema.productTags.productId, productId)
  await getDb().delete(schema.productTags).where(where)
}

export async function adminCreateProductCategory(data: { productId: string; categoryId: string }) {
  const orgId = currentOrgId()
  await getDb().insert(schema.productCategories).values({ ...data, organizationId: orgId ?? null } as any)
}

export async function adminDeleteProductCategories(productId: string) {
  const orgFilter = tenantCondition(schema.productCategories)
  const where = orgFilter ? and(eq(schema.productCategories.productId, productId), orgFilter) : eq(schema.productCategories.productId, productId)
  await getDb().delete(schema.productCategories).where(where)
}

// ---- Categories ----

export async function adminCreateCategory(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.categories).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}

export async function adminUpdateCategory(id: string, data: Record<string, any>) {
  const orgFilter = tenantCondition(schema.categories)
  const where = orgFilter ? and(eq(schema.categories.id, id), orgFilter) : eq(schema.categories.id, id)
  await getDb().update(schema.categories).set(data as any).where(where)
}

export async function adminDeleteCategory(id: string) {
  const orgFilter = tenantCondition(schema.categories)
  const where = orgFilter ? and(eq(schema.categories.id, id), orgFilter) : eq(schema.categories.id, id)
  await getDb().delete(schema.categories).where(where)
}

export async function adminFindChildCategories(parentId: string) {
  const orgFilter = tenantCondition(schema.categories)
  const where = orgFilter ? and(eq(schema.categories.parentId, parentId), orgFilter) : eq(schema.categories.parentId, parentId)
  return getDb().select().from(schema.categories).where(where)
}

// ---- Inventory helpers ----

export async function adminFindLowStockProducts(threshold: number, limit: number) {
  const conditions = [
    lte(schema.products.inventoryQuantity, threshold),
    eq(schema.products.status, 'active'),
  ]
  const orgFilter = tenantCondition(schema.products)
  if (orgFilter) conditions.push(orgFilter)
  return getDb().select().from(schema.products)
    .where(and(...conditions))
    .orderBy(asc(schema.products.inventoryQuantity))
    .limit(limit)
}

// ---- Variant update ----

export async function updateProductVariantById(id: string, data: Record<string, unknown>) {
  const orgFilter = tenantCondition(schema.productVariants)
  const where = orgFilter ? and(eq(schema.productVariants.id, id), orgFilter) : eq(schema.productVariants.id, id)
  await getDb().update(schema.productVariants).set(data as any).where(where)
}

// ---- Set product categories (delete + replace) ----

export async function setProductCategories(productId: string, categoryIds: string[]) {
  const orgFilter = tenantCondition(schema.productCategories)
  const deleteWhere = orgFilter ? and(eq(schema.productCategories.productId, productId), orgFilter) : eq(schema.productCategories.productId, productId)
  await getDb().delete(schema.productCategories).where(deleteWhere)
  const orgId = currentOrgId()
  for (const categoryId of categoryIds) {
    await getDb().insert(schema.productCategories).values({ productId, categoryId, organizationId: orgId ?? null } as any)
  }
}
