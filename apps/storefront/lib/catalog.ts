import "server-only"
import { cacheLife, cacheTag } from "next/cache"
import type { Category, Product, SearchResult, StorefrontCacheTag, StorefrontStore } from "@prood/types"
import { storeCacheTag } from "@prood/types"
import { isCommerceApiError, unwrap } from "@prood/api-client"
import { getCatalogApi } from "@/lib/commerce-api"
import { tenantIdOrMarketing } from "@/lib/tenant"

/**
 * The API expires these tags the moment something changes (see
 * `revalidateStorefront`), so the time limit only matters when it couldn't.
 */
const CATALOG_LIFE = { stale: 300, revalidate: 3600, expire: 86_400 }

export type ProductQuery = Record<string, string | number | undefined>

/** Tag the cache entry being filled with this store's tag. */
async function tagFor(storeHost: string, tag: StorefrontCacheTag): Promise<void> {
  cacheTag(storeCacheTag(tag, await tenantIdOrMarketing(storeHost)))
  cacheLife(CATALOG_LIFE)
}

export async function getStore(storeHost: string): Promise<StorefrontStore> {
  "use cache"
  await tagFor(storeHost, "store")
  return unwrap(getCatalogApi(storeHost).GET("/store"))
}

export async function getCategories(storeHost: string): Promise<Category[]> {
  "use cache"
  await tagFor(storeHost, "categories")
  return unwrap(getCatalogApi(storeHost).GET("/categories", { params: { query: {} } }))
}

export async function getProductBySlug(storeHost: string, slug: string): Promise<Product | null> {
  "use cache"
  await tagFor(storeHost, "products")
  try {
    return await unwrap(getCatalogApi(storeHost).GET("/products/by-slug/{slug}", { params: { path: { slug } } }))
  } catch (err) {
    if (isCommerceApiError(err) && err.code === "NOT_FOUND") return null
    throw err
  }
}

async function cachedProducts(storeHost: string, query: ProductQuery): Promise<SearchResult> {
  "use cache"
  await tagFor(storeHost, "products")
  return unwrap(getCatalogApi(storeHost).GET("/products", { params: { query } }))
}

/**
 * Lists, categories, sorts and pages are a small set per store, so each is
 * cached. Free-text searches are not: there is no end to them, and the API
 * caches its own answers.
 */
export async function getProducts(storeHost: string, query: ProductQuery = {}): Promise<SearchResult> {
  if (query.query) return unwrap(getCatalogApi(storeHost).GET("/products", { params: { query } }))
  return cachedProducts(storeHost, query)
}
