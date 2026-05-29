import 'server-only'
import { revalidateTag } from 'next/cache'

/** Background SWR invalidation for product list/detail caches. */
export function revalidateProducts(): void {
  revalidateTag('products', 'max')
}

/** Background SWR invalidation for category tree caches. */
export function revalidateCategories(): void {
  revalidateTag('categories', 'max')
}

/** Invalidate both catalog tags (admin bulk updates, deploy hooks). */
export function revalidateCatalog(): void {
  revalidateProducts()
  revalidateCategories()
}
