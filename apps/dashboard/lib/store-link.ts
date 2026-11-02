import "server-only"
import { requiredEnv, storeOriginForSlug } from "@prood/types"
import { getStoreSettings } from "@/lib/admin-api"
import { getActiveOrganizationId, listOrganizations } from "@/lib/auth"
import { isVercelConfigured } from "@/lib/vercel"

/** The Prood address of a store: it always works. */
export function proodAddress(slug: string): string {
  return storeOriginForSlug(requiredEnv(process.env.NEXT_PUBLIC_STOREFRONT_URL, "NEXT_PUBLIC_STOREFRONT_URL"), slug)
}

/**
 * Where a merchant's store can really be opened. While domains can't be
 * connected, a saved domain doesn't reach the store, verified or not.
 */
export async function getStoreUrl(): Promise<string | null> {
  if (isVercelConfigured()) return (await getStoreSettings()).url ?? null
  const [orgs, activeId] = await Promise.all([listOrganizations(), getActiveOrganizationId()])
  const org = orgs.find((candidate) => candidate.id === activeId) ?? orgs[0]
  return org ? proodAddress(org.slug) : null
}
