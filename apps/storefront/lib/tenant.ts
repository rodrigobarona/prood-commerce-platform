import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cacheLife, cacheTag } from "next/cache"
import { lookupTenantByHost } from "@prood/platform"

/**
 * Resolve the organization (tenant) id for the current storefront request from
 * its host: a verified custom domain, or `{slug}.{NEXT_PUBLIC_PLATFORM_DOMAIN}`.
 * In local dev that is `{slug}.localhost:3000`. Unknown hosts go to the
 * marketing site.
 */
async function lookupTenantIdForHost(host: string, platformDomain: string): Promise<string | null> {
  "use cache"
  cacheTag(`tenant-host-${host}`)
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 })
  return lookupTenantByHost(host, platformDomain)
}

export async function resolveTenantId(): Promise<string> {
  const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
  const marketingUrl = process.env.NEXT_PUBLIC_WEB_URL
  if (!platformDomain || !marketingUrl) {
    throw new Error("NEXT_PUBLIC_PLATFORM_DOMAIN and NEXT_PUBLIC_WEB_URL are required")
  }

  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase()
  const orgId = host ? await lookupTenantIdForHost(host, platformDomain) : null
  if (orgId) return orgId
  redirect(marketingUrl)
}
