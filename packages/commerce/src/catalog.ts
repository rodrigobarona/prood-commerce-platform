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
import { getAdapter } from './adapter'

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

/** Search / list products with filters, sort and pagination. */
export async function getProducts(params: SearchParams = {}): Promise<SearchResult> {
  'use cache'
  cacheTag('products')
  cacheLife(catalogLife)
  try {
    return (await getAdapter()).getProducts(params)
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
export async function getProduct(params: GetProductParams): Promise<Product> {
  'use cache'
  cacheTag('products', productTag(params))
  cacheLife(catalogLife)
  return (await getAdapter()).getProduct(params)
}

/** Fetch the category tree. */
export async function getCategories(params?: GetCategoriesParams): Promise<Category[]> {
  'use cache'
  cacheTag('categories')
  cacheLife(catalogLife)
  try {
    return (await getAdapter()).getCategories(params)
  } catch {
    return []
  }
}

/** Fetch store metadata (name, currency, locale, branding). */
export async function getStoreInfo(): Promise<StoreInfo | null> {
  'use cache'
  cacheTag('store')
  cacheLife(storeLife)
  try {
    return (await getAdapter()).getStoreInfo()
  } catch {
    return null
  }
}

/** Fetch the list of brands. */
export async function getBrands(): Promise<Brand[]> {
  'use cache'
  cacheTag('products')
  cacheLife(catalogLife)
  try {
    return (await getAdapter()).getBrands()
  } catch {
    return []
  }
}
