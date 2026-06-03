import "server-only"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { cacheLife, cacheTag } from "next/cache"
import { lookupTenantByHost } from "./tenant-db"

/**
 * Resolve the organization (tenant) id for the current storefront request.
 *
 * - Custom domains via `tenant_domain` (verified)
 * - `{slug}.{NEXT_PUBLIC_PLATFORM_DOMAIN}` via `organization.slug`
 * - `DEFAULT_TENANT_ORG_ID` when set (local dev / single-tenant)
 * - Otherwise redirect to marketing site
 */
const EXPLICIT_DEFAULT = process.env.DEFAULT_TENANT_ORG_ID
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
const MARKETING_URL = process.env.NEXT_PUBLIC_WEB_URL ?? "http://localhost:3001"

async function lookupTenantIdForHost(host: string): Promise<string | null> {
  "use cache"
  cacheTag(`tenant-host-${host}`)
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 })
  return lookupTenantByHost(host, PLATFORM_DOMAIN)
}

export async function resolveTenantId(): Promise<string> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase()
  const orgId = host ? await lookupTenantIdForHost(host) : null
  if (orgId) return orgId
  if (EXPLICIT_DEFAULT) return EXPLICIT_DEFAULT
  redirect(MARKETING_URL)
}
