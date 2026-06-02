// ---------------------------------------------------------------------------
// Tenant store_info — default row per organization
// ---------------------------------------------------------------------------

import { withTenant } from '../database/drizzle/client.js'
import {
  createStoreInfo,
  findStoreInfo,
} from '../database/drizzle/queries/store.js'

const DEFAULT_STORE = {
  currency: 'SAR',
  locale: 'en',
  timezone: 'Asia/Riyadh',
} as const

export interface EnsureStoreInfoOptions {
  name?: string
}

/** Ensure the tenant-scoped default store_info row exists (must run inside withTenant). */
export async function ensureDefaultStoreInfo(
  options: EnsureStoreInfoOptions = {},
) {
  let row = await findStoreInfo('default')

  if (!row) {
    await createStoreInfo({
      id: 'default',
      name: { en: options.name?.trim() || 'My Store' },
      currency: DEFAULT_STORE.currency,
      locale: DEFAULT_STORE.locale,
      timezone: DEFAULT_STORE.timezone,
    })
    row = await findStoreInfo('default')
  }

  if (!row) throw new Error('Failed to initialize store info')
  return row
}

/** Create the commerce store_info row for a new organization (idempotent). */
export async function provisionOrganizationStore(
  organizationId: string,
  options: EnsureStoreInfoOptions = {},
): Promise<void> {
  await withTenant(organizationId, async () => {
    await ensureDefaultStoreInfo(options)
  })
}
