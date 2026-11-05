import 'server-only'
import { revalidateTag } from 'next/cache'
import { after } from 'next/server'
import { requiredEnv, storeCacheTag, type StorefrontCacheTag } from '@prood/types'

/** Where the storefront accepts cache invalidations. */
const STOREFRONT_REVALIDATE_PATH = '/api/revalidate'

/**
 * Tell the storefront to drop its cached pages for these tags. The storefront
 * is its own deployment with its own cache, so expiring a tag here never
 * reaches it.
 */
export async function revalidateStorefront(
  tenantId: string,
  tags: readonly StorefrontCacheTag[],
): Promise<void> {
  const base = requiredEnv(process.env.NEXT_PUBLIC_STOREFRONT_URL, 'NEXT_PUBLIC_STOREFRONT_URL')
  const secret = requiredEnv(process.env.STOREFRONT_REVALIDATE_SECRET, 'STOREFRONT_REVALIDATE_SECRET')
  const res = await fetch(new URL(STOREFRONT_REVALIDATE_PATH, base), {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/json' },
    body: JSON.stringify({ tenantId, tags }),
    signal: AbortSignal.timeout(5000),
  })
  if (!res.ok) throw new Error(`Storefront revalidation answered ${res.status}`)
}

/**
 * Expire at once rather than serve stale: the storefront refetches as soon as
 * it is told, and must not be handed the old answer to cache again.
 */
function expire(tenantId: string, tags: readonly StorefrontCacheTag[]): void {
  for (const tag of tags) revalidateTag(storeCacheTag(tag, tenantId), { expire: 0 })
  after(() =>
    revalidateStorefront(tenantId, tags).catch((err: unknown) => {
      console.error(`[revalidate] storefront missed ${tags.join(', ')} for ${tenantId}`, err)
    }),
  )
}

/** Products changed: their pages, lists and stock. */
export function revalidateProducts(tenantId: string): void {
  expire(tenantId, ['products'])
}

/** Categories changed. Products carry their categories, so both go. */
export function revalidateCatalog(tenantId: string): void {
  expire(tenantId, ['products', 'categories'])
}

/** Store details changed: name, branding, contact, or how it takes payment. */
export function revalidateStore(tenantId: string): void {
  expire(tenantId, ['store'])
}
