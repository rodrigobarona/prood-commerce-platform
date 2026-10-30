// ---------------------------------------------------------------------------
// Category mapper — the one mapping from a stored category to the unified type
// ---------------------------------------------------------------------------

import type { Category } from '@prood/types'
import type { categories } from '../database/drizzle/schema/categories.js'
import { img, normalizeLocalizedField } from './helpers.js'

export function mapCategory(row: typeof categories.$inferSelect): Category {
  return {
    id: row.id,
    name: normalizeLocalizedField(row.name),
    slug: row.slug,
    description: row.description ? normalizeLocalizedField(row.description) : null,
    image: row.image ? img(row.image, null) : null,
    parentId: row.parentId ?? null,
    productCount: null,
  }
}
