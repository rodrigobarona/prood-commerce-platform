import "server-only"
import { headers } from "next/headers"
import { notFound } from "next/navigation"
import { cacheLife, cacheTag } from "next/cache"
import { lookupTenantByHost } from "./tenant-db"

/**
 * The organization (tenant) id whose store this request is serving.
 *
 * Resolution maps the request host to a store:
 * - custom domains via the `tenant_domain` table,
 * - `{slug}.{NEXT_PUBLIC_PLATFORM_DOMAIN}` subdomains via `organization.slug`.
 *
 * Fallback policy (secure by default):
 * - If `DEFAULT_TENANT_ORG_ID` is set, it's used for unmatched hosts
 *   (single-tenant deployments or local dev).
 * - Otherwise an unmatched host serves the demo store in development, but
 *   returns 404 in production rather than leaking a default store.
 */
const EXPLICIT_DEFAULT = process.env.DEFAULT_TENANT_ORG_ID
const DEV_DEFAULT = "org_demo"
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN

/**
 * Cached host → org lookup. `host` is a plain argument (the cache key), so this
 * is safe in a `'use cache'` scope; the request host is read by the caller.
 * Returns null when the host maps to no organization.
 */
async function lookupTenantIdForHost(host: string): Promise<string | null> {
  "use cache"
  cacheTag(`tenant-host-${host}`)
  cacheLife({ stale: 300, revalidate: 300, expire: 3600 })
  return lookupTenantByHost(host, PLATFORM_DOMAIN)
}

/** Resolve the active tenant (organization id) for the current request. */
export async function resolveTenantId(): Promise<string> {
  const host = (await headers()).get("host")?.split(":")[0]?.toLowerCase()
  const orgId = host ? await lookupTenantIdForHost(host) : null
  if (orgId) return orgId

  if (EXPLICIT_DEFAULT) return EXPLICIT_DEFAULT
  if (process.env.NODE_ENV !== "production") return DEV_DEFAULT

  // Unknown host in production: don't serve a default store.
  notFound()
}
