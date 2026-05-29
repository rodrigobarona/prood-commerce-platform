import "server-only"
import { headers } from "next/headers"
import { CommerceError } from "@prood/commerce"
import { getAuth, getActiveOrganizationId } from "@/lib/auth"
import { lookupTenantByHost } from "@/lib/tenant-db"

/** Coarse-grained capability a route requires of the caller. */
export type ApiScope = "storefront" | "admin"

export interface ApiCaller {
  /** The resolved tenant (organization) id every query is scoped to. */
  orgId: string
  /** Capabilities granted to this caller. */
  scopes: ApiScope[]
  /** How the caller authenticated. */
  via: "api-key" | "session" | "host"
}

interface ApiKeyMetadata {
  organizationId?: string
  scopes?: ApiScope[]
}

// The @better-auth/api-key plugin reads keys from this header by default.
const API_KEY_HEADER = "x-api-key"
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN

/**
 * Resolve the calling tenant, in priority order:
 * 1. API key (machine / agent callers) — organization + scopes from key metadata.
 * 2. First-party session cookie — the merchant's active organization.
 * 3. Request host — anonymous public storefront traffic.
 *
 * Returns null when the request carries no resolvable tenant.
 */
export async function resolveApiCaller(): Promise<ApiCaller | null> {
  const headerList = await headers()

  const key = headerList.get(API_KEY_HEADER)
  if (key) {
    const result = await getAuth().api.verifyApiKey({ body: { key } })
    if (!result.valid || !result.key) {
      throw new CommerceError("Invalid API key", "UNAUTHORIZED")
    }
    const metadata = (result.key.metadata ?? {}) as ApiKeyMetadata
    if (!metadata.organizationId) {
      throw new CommerceError(
        "API key is not bound to an organization",
        "FORBIDDEN"
      )
    }
    return {
      orgId: metadata.organizationId,
      scopes: metadata.scopes ?? ["storefront"],
      via: "api-key",
    }
  }

  const sessionOrgId = await getActiveOrganizationId()
  if (sessionOrgId) {
    return { orgId: sessionOrgId, scopes: ["admin", "storefront"], via: "session" }
  }

  const host = headerList.get("host")?.split(":")[0]?.toLowerCase()
  if (host) {
    const hostOrgId = await lookupTenantByHost(host, PLATFORM_DOMAIN)
    if (hostOrgId) {
      return { orgId: hostOrgId, scopes: ["storefront"], via: "host" }
    }
  }

  return null
}

/**
 * Resolve and authorize the caller for `scope`, or throw 401/403.
 *
 * Returns the tenant (organization) id; tenant DB scoping is owned by the
 * service layer (storefront functions take a `tenantId` argument; admin
 * functions are wrapped in `withTenant`), so this only authorizes.
 */
export async function requireCaller(scope: ApiScope): Promise<ApiCaller> {
  const caller = await resolveApiCaller()
  if (!caller) {
    throw new CommerceError("Authentication required", "UNAUTHORIZED")
  }
  if (!caller.scopes.includes(scope)) {
    throw new CommerceError("Insufficient scope for this resource", "FORBIDDEN")
  }
  return caller
}
