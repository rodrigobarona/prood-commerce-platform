// ---------------------------------------------------------------------------
// Catalog domain — product and category retrieval
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type {
  Product,
  Category,
  SearchResult,
  SearchParams,
  GetProductParams,
  GetCategoriesParams,
} from '@prood/types'
import {
  findProductById,
  findProductBySlug,
  findProducts,
  findCategories,
  findProductIdsByCategory,
} from '../database/index.js'
import { normalizeLocalizedField, img } from './helpers.js'
import { mapProduct } from './product-mapper.js'

export function createCatalogDomain() {
  return {
    async getProduct(params: GetProductParams): Promise<Product> {
      const row = params.id
        ? await findProductById(params.id)
        : params.slug
          ? await findProductBySlug(params.slug!)
          : null

      // Shopper-facing read: drafts and archived products don't exist here.
      // Merchant reads go through the admin domain.
      if (!row || row.status !== 'active') {
        throw new CommerceError(`Product not found: ${params.id ?? params.slug}`, "NOT_FOUND")
      }

      return mapProduct(row)
    },

    async getProducts(params: SearchParams): Promise<SearchResult> {
      const conditions: { field: string; op: 'eq' | 'like' | 'ilike' | 'search' | 'gte' | 'lte' | 'in'; value: any }[] = [
        { field: 'status', op: 'eq', value: 'active' },
      ]

      if (params.query) {
        conditions.push({ field: 'name', op: 'search', value: `%${params.query}%` })
      }
      if (params.categoryId) {
        const productIds = await findProductIdsByCategory(params.categoryId)
        if (productIds.length === 0) {
          return { products: { items: [], total: 0, page: params.page ?? 1, perPage: params.perPage ?? 20, hasMore: false }, facets: [], suggestions: null }
        }
        conditions.push({ field: 'id', op: 'in', value: productIds })
      }

      const minPrice = params.filters?.['minPrice']
      const maxPrice = params.filters?.['maxPrice']
      if (minPrice) {
        conditions.push({ field: 'price', op: 'gte', value: Number(minPrice) })
      }
      if (maxPrice) {
        conditions.push({ field: 'price', op: 'lte', value: Number(maxPrice) })
      }

      const page = params.page ?? 1
      const perPage = params.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findProducts({
        conditions,
        orderBy: params.sort ? { field: params.sort.field, direction: params.sort.direction } : undefined,
        limit: perPage,
        offset,
      })

      const products = await Promise.all(rows.map(mapProduct))

      return {
        products: {
          items: products,
          total,
          page,
          perPage,
          hasMore: offset + perPage < total,
        },
        facets: [],
        suggestions: null,
      }
    },

    async getCategories(params?: GetCategoriesParams): Promise<Category[]> {
      const rows = await findCategories(params?.parentId)

      return rows.map(row => ({
        id: row.id,
        name: normalizeLocalizedField(row.name),
        slug: row.slug,
        description: row.description ? normalizeLocalizedField(row.description) : null,
        image: row.image ? img(row.image, null) : null,
        parentId: row.parentId ?? null,
        productCount: null,
      }))
    },
  }
}
