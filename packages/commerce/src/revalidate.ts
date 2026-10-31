import 'server-only'
import { revalidateTag } from 'next/cache'

function scoped(tag: string, tenantId?: string): string {
  return tenantId ? `${tag}-${tenantId}` : tag
}

/** Background SWR invalidation for product list/detail caches. */
export function revalidateProducts(tenantId?: string): void {
  revalidateTag(scoped('products', tenantId), 'max')
}

/** Background SWR invalidation for category tree caches. */
export function revalidateCategories(tenantId?: string): void {
  revalidateTag(scoped('categories', tenantId), 'max')
}

/** Drop cached store info at once, so a merchant sees their own edit. */
export function revalidateStore(tenantId?: string): void {
  revalidateTag(scoped('store', tenantId), { expire: 0 })
}

/** Invalidate both catalog tags (admin bulk updates, deploy hooks). */
export function revalidateCatalog(tenantId?: string): void {
  revalidateProducts(tenantId)
  revalidateCategories(tenantId)
}
