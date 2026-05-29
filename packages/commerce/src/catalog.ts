import 'server-only'
import { cacheLife, cacheTag } from 'next/cache'
import type {
  Brand,
  Category,
  GetCategoriesParams,
  GetProductParams,
  Product,
  SearchParams,
  SearchResult,
  StoreInfo,
} from '@commercejs/types'
import { getAdapter, runScoped } from './adapter'

/** Maps Nuxt routeRules SWR: /products/** and /categories/** → 600s. */
const catalogLife = {
  stale: 600,
  revalidate: 600,
  expire: 86_400,
} as const

/** Maps Nuxt routeRules SWR: / → 3600s (store metadata, home shell). */
const storeLife = {
  stale: 3600,
  revalidate: 3600,
  expire: 86_400,
} as const

const emptySearchResult: SearchResult = {
  products: { items: [], total: 0, page: 1, perPage: 12, hasMore: false },
  facets: [],
  suggestions: null,
}

function productTag(params: GetProductParams): string {
  if (params.slug) return `product-${params.slug}`
  if (params.id) return `product-${params.id}`
  return 'product-unknown'
}

/** Suffix a cache tag with the tenant id so caches never cross tenants. */
function scoped(tag: string, tenantId?: string): string {
  return tenantId ? `${tag}-${tenantId}` : tag
}

/**
 * Search / list products with filters, sort and pagination.
 *
 * Pass `tenantId` to isolate the query (RLS) and cache per tenant. The id is a
 * plain argument, so it becomes part of the cache key and is safe to read in
 * this `'use cache'` scope.
 */
export async function getProducts(
  params: SearchParams = {},
  tenantId?: string,
): Promise<SearchResult> {
  'use cache'
  cacheTag(scoped('products', tenantId))
  cacheLife(catalogLife)
  try {
    return await runScoped(tenantId, async () => (await getAdapter()).getProducts(params))
  } catch {
    return {
      ...emptySearchResult,
      products: {
        ...emptySearchResult.products,
        page: params.page ?? 1,
        perPage: params.perPage ?? 12,
      },
    }
  }
}

/** Fetch a single product by id or slug. */
export async function getProduct(
  params: GetProductParams,
  tenantId?: string,
): Promise<Product> {
  'use cache'
  cacheTag(scoped('products', tenantId), scoped(productTag(params), tenantId))
  cacheLife(catalogLife)
  return runScoped(tenantId, async () => (await getAdapter()).getProduct(params))
}

/** Fetch the category tree. */
export async function getCategories(
  params?: GetCategoriesParams,
  tenantId?: string,
): Promise<Category[]> {
  'use cache'
  cacheTag(scoped('categories', tenantId))
  cacheLife(catalogLife)
  try {
    return await runScoped(tenantId, async () => (await getAdapter()).getCategories(params))
  } catch {
    return []
  }
}

/** Fetch store metadata (name, currency, locale, branding). */
export async function getStoreInfo(tenantId?: string): Promise<StoreInfo | null> {
  'use cache'
  cacheTag(scoped('store', tenantId))
  cacheLife(storeLife)
  try {
    return await runScoped(tenantId, async () => (await getAdapter()).getStoreInfo())
  } catch {
    return null
  }
}

/** Fetch the list of brands. */
export async function getBrands(tenantId?: string): Promise<Brand[]> {
  'use cache'
  cacheTag(scoped('products', tenantId))
  cacheLife(catalogLife)
  try {
    return await runScoped(tenantId, async () => (await getAdapter()).getBrands())
  } catch {
    return []
  }
}
