// ---------------------------------------------------------------------------
// Store domain — store metadata
// ---------------------------------------------------------------------------

import type { StoreInfo } from '@prood/types'
import { DEFAULT_LOCALES, LOCALE_META } from '@prood/types'
import { ensureDefaultStoreInfo } from '../tenant/store-info.js'
import { normalizeLocalizedField, img } from './helpers.js'

/** Narrow currency symbol for a code (e.g. EUR → €), or the code itself. */
function currencySymbol(code: string): string {
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
      .formatToParts(0)
      .find((part) => part.type === 'currency')?.value ?? code
  } catch {
    return code
  }
}

export function createStoreDomain() {
  return {
    async getStoreInfo(): Promise<StoreInfo> {
      const row = await ensureDefaultStoreInfo()

      return {
        name: normalizeLocalizedField(row.name),
        description: row.description ? normalizeLocalizedField(row.description) : null,
        logo: row.logo ? img(row.logo, 'Store logo') : null,
        currencies: ((row.supportedCurrencies ?? [row.currency]) as string[]).map((c: string) => ({
          code: c,
          symbol: currencySymbol(c),
          isDefault: c === row.currency,
        })),
        locales: ((row.supportedLocales ?? [...DEFAULT_LOCALES]) as string[]).map((l: string) => ({
          code: l,
          name: LOCALE_META[l]?.name ?? l,
          direction: LOCALE_META[l]?.direction ?? 'ltr',
          isDefault: l === row.locale,
        })),
        country: 'PT',
      }
    },
  }
}
