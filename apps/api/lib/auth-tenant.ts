import "server-only"
import { headers } from "next/headers"
import type { AgentSession } from "@better-auth/agent-auth"
import { CommerceError } from "@prood/commerce"
import { eq } from "drizzle-orm"
import { getAuth, getActiveOrganizationId } from "@/lib/auth"
import { authDb } from "@/lib/auth/db"
import { member } from "@/lib/auth/schema"
import { lookupTenantByHost } from "@/lib/tenant-db"

/** Coarse-grained capability a route requires of the caller. */
export type ApiScope = "storefront" | "admin"

export interface ApiCaller {
  /** The resolved tenant (organization) id every query is scoped to. */
  orgId: string
  /** Capabilities granted to this caller. */
  scopes: ApiScope[]
  /** How the caller authenticated. */
  via: "api-key" | "session" | "host" | "agent"
}

interface ApiKeyMetadata {
  organizationId?: string
  scopes?: ApiScope[]
}

// The @better-auth/api-key plugin reads keys from this header by default.
const API_KEY_HEADER = "x-api-key"
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN

function scopesFromAgentSession(session: AgentSession): ApiScope[] {
  const active = session.agent.capabilityGrants
    .filter((g) => g.status === "active")
    .map((g) => g.capability)
  const scopes: ApiScope[] = []
  if (active.some((c) => c.startsWith("admin"))) scopes.push("admin")
  if (active.some((c) => !c.startsWith("admin"))) scopes.push("storefront")
  return scopes
}

async function resolveOrgForAgent(session: AgentSession): Promise<string | null> {
  const meta = session.agent.metadata as { organizationId?: string } | null
  if (meta?.organizationId) return meta.organizationId

  const userId = session.user?.id
  if (!userId) return null

  const rows = await authDb
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
    .limit(1)

  return rows[0]?.organizationId ?? null
}

/**
 * Resolve the calling tenant, in priority order:
 * 1. Agent Auth JWT (`Authorization: Bearer`) — grants map to storefront/admin scopes.
 * 2. API key (machine callers) — organization + scopes from key metadata.
 * 3. First-party session cookie — the merchant's active organization.
 * 4. Request host — anonymous public storefront traffic.
 *
 * Returns null when the request carries no resolvable tenant.
 */
export async function resolveApiCaller(): Promise<ApiCaller | null> {
  const headerList = await headers()

  const authorization = headerList.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    const agentSession = await getAuth().api.getAgentSession({
      headers: headerList,
    })
    if (agentSession) {
      const orgId = await resolveOrgForAgent(agentSession)
      if (!orgId) {
        throw new CommerceError(
          "Agent session is not bound to an organization",
          "FORBIDDEN"
        )
      }
      const scopes = scopesFromAgentSession(agentSession)
      if (scopes.length === 0) {
        throw new CommerceError("Agent has no active capability grants", "FORBIDDEN")
      }
      return { orgId, scopes, via: "agent" }
    }
  }

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
