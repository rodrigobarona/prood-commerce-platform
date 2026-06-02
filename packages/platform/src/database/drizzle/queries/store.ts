// ---------------------------------------------------------------------------
// Drizzle: Store queries
// ---------------------------------------------------------------------------

import { and, eq } from 'drizzle-orm'
import { getCurrentOrganizationId, getDb } from '../client.js'
import * as schema from '../schema/index.js'

function storeScope(id: string) {
  const orgId = getCurrentOrganizationId()
  if (!orgId) {
    return eq(schema.storeInfo.id, id)
  }
  return and(eq(schema.storeInfo.id, id), eq(schema.storeInfo.organizationId, orgId))
}

export async function findStoreInfo(id: string) {
  const [row] = await getDb()
    .select()
    .from(schema.storeInfo)
    .where(storeScope(id))
  return row ?? null
}

export async function createStoreInfo(data: Record<string, unknown>) {
  const orgId = getCurrentOrganizationId()
  if (!orgId) {
    throw new Error('createStoreInfo requires an active organization scope')
  }

  await getDb().insert(schema.storeInfo).values({
    ...data,
    organizationId: orgId,
  } as typeof schema.storeInfo.$inferInsert)
}
