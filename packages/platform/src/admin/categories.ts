// ---------------------------------------------------------------------------
// Admin: Category CRUD
// ---------------------------------------------------------------------------

import type { Category } from '@prood/types'
import type { CreateCategoryInput, UpdateCategoryInput } from './types.js'
import {
  findCategoryById,
  insertCategory,
  updateCategoryById,
  deleteCategoryById,
  findCategoryChildren,
} from '../database/index.js'
import { normalizeLocalizedField, slugifyLocalized, img } from '../domains/helpers.js'

function mapCategory(row: any): Category {
  return {
    id: row.id,
    name: normalizeLocalizedField(row.name),
    slug: row.slug,
    description: row.description ? normalizeLocalizedField(row.description) : null,
    image: row.image ? img(row.image, null) : null,
    parentId: row.parentId ?? null,
    children: [],
    productCount: null,
  }
}

export function createAdminCategoriesDomain() {
  return {
    async createCategory(input: CreateCategoryInput): Promise<Category> {
      const id = crypto.randomUUID()
      const slug = input.slug ?? slugifyLocalized(input.name)

      await insertCategory({
        id,
        name: input.name,
        slug,
        description: input.description ?? null,
        image: input.image ?? null,
        parentId: input.parentId ?? null,
        sortOrder: input.sortOrder ?? 0,
      })

      const row = await findCategoryById(id)
      return mapCategory(row)
    },

    async updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
      const updates: Record<string, unknown> = {}

      if (input.name != null) updates.name = input.name
      if (input.slug != null) updates.slug = input.slug
      if (input.description !== undefined) updates.description = input.description
      if (input.image !== undefined) updates.image = input.image
      if (input.parentId !== undefined) updates.parentId = input.parentId
      if (input.sortOrder != null) updates.sortOrder = input.sortOrder

      await updateCategoryById(id, updates)

      const row = await findCategoryById(id)
      return mapCategory(row)
    },

    async deleteCategory(id: string): Promise<void> {
      const children = await findCategoryChildren(id)
      if (children.length > 0) {
        throw new Error(`Cannot delete category ${id}: it has ${children.length} child categories`)
      }

      await deleteCategoryById(id)
    },
  }
}
