import type { AgentSession } from "@better-auth/agent-auth"
import { assertFeature } from "@prood/commerce"
import { CommerceError } from "@prood/types"
import { eq } from "drizzle-orm"
import { getAuth, getSession, resolveActiveOrganizationId } from "@/lib/auth"
import { authDb } from "@/lib/auth/db"
import { member } from "@/lib/auth/schema"
import { getOrganizationLimits } from "@/lib/org-plan"
import { lookupTenantByHost } from "@/lib/tenant-db"
import type { ApiCaller, ApiScope } from "@/lib/auth-tenant"

interface ApiKeyMetadata {
  organizationId?: string
  scopes?: ApiScope[]
}

const API_KEY_HEADER = "x-api-key"
const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
const DEFAULT_TENANT_ORG_ID = process.env.DEFAULT_TENANT_ORG_ID

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

/** Resolve tenant + scopes from raw request headers (REST, MCP, etc.). */
export async function resolveCallerFromHeaders(
  headerList: Headers
): Promise<ApiCaller | null> {
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
      const limits = await getOrganizationLimits(orgId)
      assertFeature(
        limits.agentAuthEnabled,
        "Agent Auth requires a Grow plan or higher",
      )
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
    const scopes = metadata.scopes ?? ["storefront"]
    const limits = await getOrganizationLimits(metadata.organizationId)
    if (scopes.includes("admin") && !limits.apiWriteEnabled) {
      throw new CommerceError(
        "Write access requires a Grow plan or higher",
        "FORBIDDEN",
      )
    }
    return {
      orgId: metadata.organizationId,
      scopes,
      via: "api-key",
    }
  }

  const session = await getSession(headerList)
  const sessionOrgId = await resolveActiveOrganizationId(headerList)
  if (sessionOrgId && session?.user) {
    return {
      orgId: sessionOrgId,
      scopes: ["admin", "storefront"],
      via: "session",
      userId: session.user.id,
    }
  }

  // Only trust x-storefront-host for tenant resolution — the raw Host header
  // is the API's own hostname (e.g. api-prood.vercel.app) and can never
  // resolve to a storefront tenant.
  const storefrontHost = headerList
    .get("x-storefront-host")
    ?.split(":")[0]
    ?.toLowerCase()
  if (storefrontHost) {
    const hostOrgId = await lookupTenantByHost(storefrontHost, PLATFORM_DOMAIN)
    if (hostOrgId) {
      return {
        orgId: hostOrgId,
        scopes: ["storefront"],
        via: session?.user ? "session" : "host",
        userId: session?.user?.id,
      }
    }
  }

  if (session?.user && !DEFAULT_TENANT_ORG_ID) {
    throw new CommerceError(
      "Session is not bound to a store organization",
      "FORBIDDEN",
    )
  }

  // Only fall back to the default org for non-platform hosts (local dev,
  // Vercel previews). Platform subdomains with unknown slugs must fail so
  // the storefront can redirect to the marketing site.
  const isPlatformSubdomain =
    PLATFORM_DOMAIN &&
    storefrontHost?.endsWith(`.${PLATFORM_DOMAIN}`)
  if (DEFAULT_TENANT_ORG_ID && !isPlatformSubdomain) {
    return {
      orgId: DEFAULT_TENANT_ORG_ID,
      scopes: ["storefront"],
      via: "host",
      userId: session?.user?.id,
    }
  }

  return null
}

export async function requireCallerFromHeaders(
  headerList: Headers,
  scope: ApiScope
): Promise<ApiCaller> {
  const caller = await resolveCallerFromHeaders(headerList)
  if (!caller) {
    throw new CommerceError("Authentication required", "UNAUTHORIZED")
  }
  if (!caller.scopes.includes(scope)) {
    throw new CommerceError("Insufficient scope for this resource", "FORBIDDEN")
  }
  return caller
}
