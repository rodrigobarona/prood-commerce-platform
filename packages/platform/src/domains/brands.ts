// ---------------------------------------------------------------------------
// Brands domain — product brand listing
// ---------------------------------------------------------------------------

import type { Brand } from '@prood/types'
import { findBrands } from '../database/index.js'
import { normalizeLocalizedField, resolveLocalized, img } from './helpers.js'

export function createBrandsDomain() {
  return {
    async getBrands(): Promise<Brand[]> {
      const rows = await findBrands()
      return rows.map((row: any) => ({
        id: row.id,
        name: normalizeLocalizedField(row.name),
        slug: row.slug,
        logo: row.logo ? img(row.logo, resolveLocalized(normalizeLocalizedField(row.name))) : null,
        description: row.description ? normalizeLocalizedField(row.description) : null,
        isActive: row.isActive ?? true,
      }))
    },
  }
}
