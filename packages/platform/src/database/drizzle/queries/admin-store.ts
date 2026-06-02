// ---------------------------------------------------------------------------
// Drizzle: Admin store queries
// ---------------------------------------------------------------------------

import { and, eq } from 'drizzle-orm'
import { getDb } from '../client.js'
import * as schema from '../schema/index.js'
import { tenantCondition } from './tenant-filter.js'

export async function adminUpdateStoreInfo(id: string, data: Record<string, unknown>) {
  await getDb()
    .update(schema.storeInfo)
    .set({
      ...data,
      updatedAt: new Date(),
    } as Partial<typeof schema.storeInfo.$inferInsert>)
    .where(and(eq(schema.storeInfo.id, id), tenantCondition(schema.storeInfo)))
}
