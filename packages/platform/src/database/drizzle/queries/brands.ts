// ---------------------------------------------------------------------------
// Drizzle: Brands queries
// ---------------------------------------------------------------------------

import { eq, and, asc } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, currentOrgId } from './tenant-filter.js'

export async function findBrands() {
  const conditions: any[] = [eq(schema.brands.isActive, true)]
  const orgFilter = tenantCondition(schema.brands)
  if (orgFilter) conditions.push(orgFilter)
  return getDb().select().from(schema.brands)
    .where(and(...conditions))
    .orderBy(asc(schema.brands.name))
}

export async function findBrandById(id: string) {
  const orgFilter = tenantCondition(schema.brands)
  const where = orgFilter ? and(eq(schema.brands.id, id), orgFilter) : eq(schema.brands.id, id)
  const [row] = await getDb().select().from(schema.brands).where(where)
  return row ?? null
}

export async function insertBrand(data: Record<string, any>) {
  const orgId = currentOrgId()
  await getDb().insert(schema.brands).values({ ...data, organizationId: orgId ?? data.organizationId ?? null } as any)
}
