// ---------------------------------------------------------------------------
// Drizzle: Store queries
// ---------------------------------------------------------------------------

import { and, eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition, requireOrgId } from './tenant-filter.js'

export async function findStoreInfo(id: string) {
  const [row] = await getDb()
    .select()
    .from(schema.storeInfo)
    .where(and(eq(schema.storeInfo.id, id), tenantCondition(schema.storeInfo)))
  return row ?? null
}

export async function createStoreInfo(data: Record<string, unknown>) {
  const orgId = requireOrgId()
  await getDb().insert(schema.storeInfo).values({
    ...data,
    organizationId: orgId,
  } as typeof schema.storeInfo.$inferInsert)
}
