// ---------------------------------------------------------------------------
// Drizzle: Catalog queries
// ---------------------------------------------------------------------------

import { eq, sql, and, or, asc, desc, gte, lte } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition } from './tenant-filter.js'

export async function findProductById(id: string) {
  const orgFilter = tenantCondition(schema.products)
  const where = orgFilter ? and(eq(schema.products.id, id), orgFilter) : eq(schema.products.id, id)
  const [row] = await getDb().select().from(schema.products).where(where)
  return row ?? null
}

export async function findProductBySlug(slug: string) {
  const orgFilter = tenantCondition(schema.products)
  const where = orgFilter ? and(eq(schema.products.slug, slug), orgFilter) : eq(schema.products.slug, slug)
  const [row] = await getDb().select().from(schema.products).where(where)
  return row ?? null
}

export async function findProducts(opts: {
  conditions: { field: string; op: 'eq' | 'like' | 'ilike' | 'search' | 'gte' | 'lte' | 'in'; value: any }[]
  orderBy?: { field: string; direction: 'asc' | 'desc' }
  limit: number
  offset: number
}) {
  const db = getDb()
  const conditions = opts.conditions.map(c => {
    const col = (schema.products as any)[c.field] ?? schema.products.createdAt
    switch (c.op) {
      case 'eq': return eq(col, c.value)
      case 'like': return sql`${col}::text ilike ${c.value}`
      case 'ilike': return sql`${col}::text ilike ${c.value}`
      case 'search': return or(
        sql`${schema.products.name}::text ilike ${c.value}`,
        sql`${schema.products.description}::text ilike ${c.value}`,
      )!
      case 'gte': return sql`${col} >= ${c.value}`
      case 'lte': return sql`${col} <= ${c.value}`
      case 'in': return sql`${col} IN (${c.value})`
      default: return eq(col, c.value)
    }
  })

  const orgFilter = tenantCondition(schema.products)
  if (orgFilter) conditions.push(orgFilter)

  const sortCol = opts.orderBy?.field === 'price' ? schema.products.price
    : opts.orderBy?.field === 'name' ? schema.products.name
    : schema.products.createdAt
  const orderFn = opts.orderBy?.direction === 'asc' ? asc : desc

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const rows = await db.select().from(schema.products)
    .where(whereClause)
    .orderBy(orderFn(sortCol))
    .limit(opts.limit)
    .offset(opts.offset)

  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.products)
    .where(whereClause)

  return { rows, total: countResult[0]?.count ?? 0 }
}

export async function findCategories(parentId?: string) {
  const db = getDb()
  const orgFilter = tenantCondition(schema.categories)
  if (parentId) {
    const where = orgFilter ? and(eq(schema.categories.parentId, parentId), orgFilter) : eq(schema.categories.parentId, parentId)
    return db.select().from(schema.categories)
      .where(where)
      .orderBy(asc(schema.categories.sortOrder))
  }
  return db.select().from(schema.categories)
    .where(orgFilter)
    .orderBy(asc(schema.categories.sortOrder))
}

export async function findProductImages(productId: string) {
  const orgFilter = tenantCondition(schema.productImages)
  const where = orgFilter ? and(eq(schema.productImages.productId, productId), orgFilter) : eq(schema.productImages.productId, productId)
  return getDb().select().from(schema.productImages)
    .where(where)
    .orderBy(asc(schema.productImages.sortOrder))
}

export async function findProductVariants(productId: string) {
  const orgFilter = tenantCondition(schema.productVariants)
  const where = orgFilter ? and(eq(schema.productVariants.productId, productId), orgFilter) : eq(schema.productVariants.productId, productId)
  return getDb().select().from(schema.productVariants)
    .where(where)
    .orderBy(asc(schema.productVariants.sortOrder))
}

export async function findProductAttributes(productId: string) {
  const orgFilter = tenantCondition(schema.productAttributes)
  const where = orgFilter ? and(eq(schema.productAttributes.productId, productId), orgFilter) : eq(schema.productAttributes.productId, productId)
  return getDb().select().from(schema.productAttributes)
    .where(where)
}

export async function findProductCategoryIds(productId: string): Promise<string[]> {
  const orgFilter = tenantCondition(schema.productCategories)
  const where = orgFilter ? and(eq(schema.productCategories.productId, productId), orgFilter) : eq(schema.productCategories.productId, productId)
  const rows = await getDb().select({ categoryId: schema.productCategories.categoryId })
    .from(schema.productCategories)
    .where(where)
  return rows.map(r => r.categoryId)
}

export async function findProductIdsByCategory(categoryId: string): Promise<string[]> {
  const orgFilter = tenantCondition(schema.productCategories)
  const where = orgFilter ? and(eq(schema.productCategories.categoryId, categoryId), orgFilter) : eq(schema.productCategories.categoryId, categoryId)
  const rows = await getDb().select({ productId: schema.productCategories.productId })
    .from(schema.productCategories)
    .where(where)
  return rows.map(r => r.productId)
}

export async function findProductTags(productId: string): Promise<string[]> {
  const orgFilter = tenantCondition(schema.productTags)
  const where = orgFilter ? and(eq(schema.productTags.productId, productId), orgFilter) : eq(schema.productTags.productId, productId)
  const rows = await getDb().select().from(schema.productTags)
    .where(where)
  return rows.map(r => r.tag)
}

export async function findCategoryById(id: string) {
  const orgFilter = tenantCondition(schema.categories)
  const where = orgFilter ? and(eq(schema.categories.id, id), orgFilter) : eq(schema.categories.id, id)
  const [row] = await getDb().select().from(schema.categories).where(where)
  return row ?? null
}
