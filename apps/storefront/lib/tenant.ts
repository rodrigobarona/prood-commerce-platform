import "server-only"
import { notFound, redirect } from "next/navigation"
import { cacheLife, cacheTag } from "next/cache"
import { host } from "next/root-params"
import { lookupTenantByHost } from "@prood/platform"
import { requiredEnv } from "@prood/types"
import { BUILD_HOST, requestHost } from "@/lib/store-host"

/**
 * The organization (tenant) a store host belongs to: a verified custom domain,
 * or `{slug}.{NEXT_PUBLIC_PLATFORM_DOMAIN}` (`{slug}.localhost` in local dev).
 */
export async function tenantIdForHost(storeHost: string): Promise<string | null> {
  if (storeHost === BUILD_HOST) notFound()
  // Next builds `sitemap.xml` ahead with a stand-in host of `-`, which no store has.
  if (!storeHost.includes(".")) return null
  return lookupTenant(storeHost)
}

async function lookupTenant(storeHost: string): Promise<string | null> {
  "use cache"
  cacheTag(`tenant-host-${storeHost}`)
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 })
  return lookupTenantByHost(storeHost, requiredEnv(process.env.NEXT_PUBLIC_PLATFORM_DOMAIN, "NEXT_PUBLIC_PLATFORM_DOMAIN"))
}

/** The tenant of a store host. Unknown hosts go to the marketing site. */
export async function tenantIdOrMarketing(storeHost: string): Promise<string> {
  const orgId = await tenantIdForHost(storeHost)
  if (orgId) return orgId
  redirect(requiredEnv(process.env.NEXT_PUBLIC_WEB_URL, "NEXT_PUBLIC_WEB_URL"))
}

/** The tenant of the store being rendered. Unknown hosts go to the marketing site. */
export async function resolveTenantId(): Promise<string> {
  return tenantIdOrMarketing(await host())
}

/** The same, for Route Handlers and Server Actions, which have no root params. */
export async function resolveRequestTenantId(): Promise<string> {
  return tenantIdOrMarketing(await requestHost())
}
