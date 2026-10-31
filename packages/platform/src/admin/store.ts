// ---------------------------------------------------------------------------
// Admin: Store settings management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { StoreSettings, UpdateStoreInput } from './types.js'
import { ensureDefaultStoreInfo } from '../tenant/store-info.js'
import { countOrders, updateStoreInfo } from '../database/index.js'
import { normalizeLocalizedField } from '../domains/helpers.js'

function mapStoreSettings(row: any, currencyLocked: boolean): StoreSettings {
  let supportedCurrencies: string[] = ['EUR']
  let supportedLocales: string[] = ['en']

  try {
    if (row.supportedCurrencies) {
      supportedCurrencies = Array.isArray(row.supportedCurrencies)
        ? row.supportedCurrencies
        : typeof row.supportedCurrencies === 'string'
          ? JSON.parse(row.supportedCurrencies)
          : [row.currency]
    }
    if (row.supportedLocales) {
      supportedLocales = Array.isArray(row.supportedLocales)
        ? row.supportedLocales
        : typeof row.supportedLocales === 'string'
          ? JSON.parse(row.supportedLocales)
          : [row.locale]
    }
  } catch {}

  return {
    name: normalizeLocalizedField(row.name),
    description: row.description ? normalizeLocalizedField(row.description) : null,
    logo: row.logo ?? null,
    favicon: row.favicon ?? null,
    currency: row.currency,
    locale: row.locale,
    timezone: row.timezone,
    country: row.country,
    supportedCurrencies,
    supportedLocales,
    contactEmail: row.contactEmail ?? null,
    contactPhone: row.contactPhone ?? null,
    address: row.address ?? null,
    socialLinks: row.socialLinks,
    currencyLocked,
  }
}

export function createAdminStoreDomain() {
  return {
    async getStoreSettings(): Promise<StoreSettings> {
      const row = await ensureDefaultStoreInfo()
      return mapStoreSettings(row, (await countOrders()) > 0)
    },

    async updateStoreSettings(input: UpdateStoreInput): Promise<StoreSettings> {
      const updates: Record<string, unknown> = {}

      if (input.currency != null) {
        const { currency } = await ensureDefaultStoreInfo()
        // Orders keep the currency they were charged in, and nothing converts
        // prices, so a store has one currency for life once it has sold.
        if (input.currency !== currency && (await countOrders()) > 0) {
          throw new CommerceError('The store currency cannot change once it has orders.', 'VALIDATION', 422)
        }
      }

      if (input.name != null) updates.name = input.name
      if (input.description !== undefined) updates.description = input.description
      if (input.logo !== undefined) updates.logo = input.logo
      if (input.favicon !== undefined) updates.favicon = input.favicon
      if (input.currency != null) updates.currency = input.currency
      if (input.locale != null) updates.locale = input.locale
      if (input.timezone != null) updates.timezone = input.timezone
      if (input.country != null) updates.country = input.country
      if (input.contactEmail !== undefined) updates.contactEmail = input.contactEmail
      if (input.contactPhone !== undefined) updates.contactPhone = input.contactPhone
      if (input.address !== undefined) updates.address = input.address
      if (input.socialLinks !== undefined) updates.socialLinks = input.socialLinks

      await updateStoreInfo('default', updates)

      return this.getStoreSettings()
    },
  }
}
