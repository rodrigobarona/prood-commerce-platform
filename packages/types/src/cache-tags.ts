/**
 * What a store's cached data is tagged by, on the API and on the storefront.
 * A tag is suffixed with the tenant id (`products-org_123`), so expiring one
 * store never touches another.
 */
export const STOREFRONT_CACHE_TAGS = ['products', 'categories', 'store'] as const

export type StorefrontCacheTag = (typeof STOREFRONT_CACHE_TAGS)[number]

export function storeCacheTag(tag: StorefrontCacheTag, tenantId: string): string {
  return `${tag}-${tenantId}`
}
