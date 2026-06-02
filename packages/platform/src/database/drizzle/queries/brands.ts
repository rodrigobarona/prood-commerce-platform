// ---------------------------------------------------------------------------
// Drizzle: Brands queries
// ---------------------------------------------------------------------------

import { eq, and, asc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'

export async function findBrands() {
  return getDb().select().from(schema.brands)
    .where(and(eq(schema.brands.isActive, true), tenantCondition(schema.brands)))
    .orderBy(asc(schema.brands.name))
}

export async function findBrandById(id: string) {
  const [row] = await getDb().select().from(schema.brands)
    .where(and(eq(schema.brands.id, id), tenantCondition(schema.brands)))
  return row ?? null
}

export async function insertBrand(data: Record<string, any>) {
  const orgId = requireOrgId()
  await getDb().insert(schema.brands).values({ ...data, organizationId: orgId } as any)
}
