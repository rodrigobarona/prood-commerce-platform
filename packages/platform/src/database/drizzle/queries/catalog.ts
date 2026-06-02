// ---------------------------------------------------------------------------
// Drizzle: Catalog queries
// ---------------------------------------------------------------------------

import { eq, sql, and, or, asc, desc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition } from './tenant-filter.js'

export async function findProductById(id: string) {
  const [row] = await getDb().select().from(schema.products)
    .where(and(eq(schema.products.id, id), tenantCondition(schema.products)))
  return row ?? null
}

export async function findProductBySlug(slug: string) {
  const [row] = await getDb().select().from(schema.products)
    .where(and(eq(schema.products.slug, slug), tenantCondition(schema.products)))
  return row ?? null
}

export async function findProducts(opts: {
  conditions: { field: string; op: 'eq' | 'like' | 'ilike' | 'search' | 'gte' | 'lte' | 'in'; value: any }[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  limit: number
  offset: number
}) {
  const db = getDb()
  const conditions: any[] = [tenantCondition(schema.products)]

  for (const c of opts.conditions) {
    const col = (schema.products as any)[c.field] ?? schema.products.createdAt
    switch (c.op) {
      case 'eq': conditions.push(eq(col, c.value)); break
      case 'like':
      case 'ilike': conditions.push(sql`${col}::text ilike ${c.value}`); break
      case 'search': conditions.push(or(
        sql`${schema.products.name}::text ilike ${c.value}`,
        sql`${schema.products.description}::text ilike ${c.value}`,
      )!); break
      case 'gte': conditions.push(sql`${col} >= ${c.value}`); break
      case 'lte': conditions.push(sql`${col} <= ${c.value}`); break
      case 'in': conditions.push(sql`${col} IN (${c.value})`); break
      default: conditions.push(eq(col, c.value))
    }
  }

  const sortCol = opts.orderBy?.field === 'price' ? schema.products.price
    : opts.orderBy?.field === 'name' ? schema.products.name
    : schema.products.createdAt
  const orderFn = opts.orderBy?.direction === 'asc' ? asc : desc

  const where = and(...conditions)

  const rows = await db.select().from(schema.products)
    .where(where)
    .orderBy(orderFn(sortCol))
    .limit(opts.limit)
    .offset(opts.offset)

  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.products)
    .where(where)

  return { rows, total: countResult[0]?.count ?? 0 }
}

export async function findCategories(parentId?: string) {
  const conditions: any[] = [tenantCondition(schema.categories)]
  if (parentId) conditions.push(eq(schema.categories.parentId, parentId))
  return getDb().select().from(schema.categories)
    .where(and(...conditions))
    .orderBy(asc(schema.categories.sortOrder))
}

export async function findProductImages(productId: string) {
  return getDb().select().from(schema.productImages)
    .where(and(eq(schema.productImages.productId, productId), tenantCondition(schema.productImages)))
    .orderBy(asc(schema.productImages.sortOrder))
}

export async function findProductVariants(productId: string) {
  return getDb().select().from(schema.productVariants)
    .where(and(eq(schema.productVariants.productId, productId), tenantCondition(schema.productVariants)))
    .orderBy(asc(schema.productVariants.sortOrder))
}

export async function findProductAttributes(productId: string) {
  return getDb().select().from(schema.productAttributes)
    .where(and(eq(schema.productAttributes.productId, productId), tenantCondition(schema.productAttributes)))
}

export async function findProductCategoryIds(productId: string): Promise<string[]> {
  const rows = await getDb().select({ categoryId: schema.productCategories.categoryId })
    .from(schema.productCategories)
    .where(and(eq(schema.productCategories.productId, productId), tenantCondition(schema.productCategories)))
  return rows.map(r => r.categoryId)
}

export async function findProductIdsByCategory(categoryId: string): Promise<string[]> {
  const rows = await getDb().select({ productId: schema.productCategories.productId })
    .from(schema.productCategories)
    .where(and(eq(schema.productCategories.categoryId, categoryId), tenantCondition(schema.productCategories)))
  return rows.map(r => r.productId)
}

export async function findProductTags(productId: string): Promise<string[]> {
  const rows = await getDb().select().from(schema.productTags)
    .where(and(eq(schema.productTags.productId, productId), tenantCondition(schema.productTags)))
  return rows.map(r => r.tag)
}

export async function findCategoryById(id: string) {
  const [row] = await getDb().select().from(schema.categories)
    .where(and(eq(schema.categories.id, id), tenantCondition(schema.categories)))
  return row ?? null
}
