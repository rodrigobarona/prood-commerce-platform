// ---------------------------------------------------------------------------
// Store domain — store metadata
// ---------------------------------------------------------------------------

import type { StoreInfo } from '@prood/types'
import { DEFAULT_LOCALES, LOCALE_META } from '@prood/types'
import { findStoreInfo, createStoreInfo as dbCreateStoreInfo } from '../database/index.js'
import { normalizeLocalizedField, img } from './helpers.js'

export function createStoreDomain() {
  return {
    async getStoreInfo(): Promise<StoreInfo> {
      let row = await findStoreInfo('default')

      if (!row) {
        await dbCreateStoreInfo({
          id: 'default',
          name: { en: 'My Store' },
          currency: 'SAR',
          locale: 'en',
          timezone: 'Asia/Riyadh',
        })
        row = await findStoreInfo('default')
      }

      if (!row) throw new Error('Failed to initialize store info')

      return {
        name: normalizeLocalizedField(row.name),
        description: row.description ? normalizeLocalizedField(row.description) : null,
        logo: row.logo ? img(row.logo, 'Store logo') : null,
        currencies: ((row.supportedCurrencies ?? [row.currency]) as string[]).map((c: string) => ({
          code: c,
          symbol: c === 'SAR' ? 'ر.س' : c === 'AED' ? 'د.إ' : c,
          isDefault: c === row.currency,
        })),
        locales: ((row.supportedLocales ?? [...DEFAULT_LOCALES]) as string[]).map((l: string) => ({
          code: l,
          name: LOCALE_META[l]?.name ?? l,
          direction: LOCALE_META[l]?.direction ?? 'ltr',
          isDefault: l === row.locale,
        })),
        country: 'SA',
      }
    },
  }
}
