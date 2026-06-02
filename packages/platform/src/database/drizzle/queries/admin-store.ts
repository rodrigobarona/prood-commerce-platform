// ---------------------------------------------------------------------------
// Drizzle: Admin store queries
// ---------------------------------------------------------------------------

import { and, eq } from 'drizzle-orm'
import { getCurrentOrganizationId, getDb } from '../client.js'
import * as schema from '../schema/index.js'

export async function adminUpdateStoreInfo(id: string, data: Record<string, unknown>) {
  const orgId = getCurrentOrganizationId()
  if (!orgId) {
    throw new Error('adminUpdateStoreInfo requires an active organization scope')
  }

  await getDb()
    .update(schema.storeInfo)
    .set({
      ...data,
      updatedAt: new Date(),
    } as Partial<typeof schema.storeInfo.$inferInsert>)
    .where(and(eq(schema.storeInfo.id, id), eq(schema.storeInfo.organizationId, orgId)))
}
