import { assertFeature } from "@prood/commerce"
import { CommerceError } from "@prood/types"
import { getAuth, getSession, resolveActiveOrganizationId } from "@/lib/auth"
import { getOrganizationLimits } from "@/lib/org-plan"
import { lookupTenantByHost } from "@prood/platform"
import { resolveOrgForAgent } from "@/lib/agent-org"
import {
  assertCapability,
  operationForRequest,
  REQUEST_TARGET_HEADER,
} from "@/lib/agent-capability"
import type { ApiCaller, ApiScope } from "@/lib/auth-tenant"

const API_KEY_HEADER = "x-api-key"

function platformDomain(): string {
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
  if (!domain) throw new Error("NEXT_PUBLIC_PLATFORM_DOMAIN is required")
  return domain
}

function parseApiKeyScopes(metadata: unknown): ApiScope[] {
  const scopes = (metadata as { scopes?: unknown } | null)?.scopes
  if (!Array.isArray(scopes)) return ["storefront"]
  return scopes.filter((s): s is ApiScope => s === "storefront" || s === "admin")
}

function scopesFromCapabilities(capabilities: string[]): ApiScope[] {
  const scopes: ApiScope[] = []
  if (capabilities.some((c) => c.startsWith("admin"))) scopes.push("admin")
  if (capabilities.some((c) => !c.startsWith("admin"))) scopes.push("storefront")
  return scopes
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
          "This agent isn't bound to a store. Approve it in your dashboard.",
          "FORBIDDEN"
        )
      }
      const limits = await getOrganizationLimits(orgId)
      assertFeature(
        limits.agentAuthEnabled,
        "Agent Auth requires a Grow plan or higher",
      )
      const capabilities = agentSession.agent.capabilityGrants
        .filter((grant) => grant.status === "active")
        .map((grant) => grant.capability)
      const scopes = scopesFromCapabilities(capabilities)
      if (scopes.length === 0) {
        throw new CommerceError("Agent has no active capability grants", "FORBIDDEN")
      }
      return { orgId, scopes, via: "agent", capabilities }
    }
  }

  const key = headerList.get(API_KEY_HEADER)
  if (key) {
    const result = await getAuth().api.verifyApiKey({ body: { key } })
    if (!result.valid || !result.key) {
      throw new CommerceError("Invalid API key", "UNAUTHORIZED")
    }
    const orgId = result.key.referenceId
    const scopes = parseApiKeyScopes(result.key.metadata)
    const limits = await getOrganizationLimits(orgId)
    if (scopes.includes("admin") && !limits.apiWriteEnabled) {
      throw new CommerceError(
        "Write access requires a Grow plan or higher",
        "FORBIDDEN",
      )
    }
    return { orgId, scopes, via: "api-key" }
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
    const hostOrgId = await lookupTenantByHost(storefrontHost, platformDomain())
    if (hostOrgId) {
      return {
        orgId: hostOrgId,
        scopes: ["storefront"],
        via: session?.user ? "session" : "host",
        userId: session?.user?.id,
      }
    }
  }

  if (session?.user) {
    throw new CommerceError(
      "Session is not bound to a store organization",
      "FORBIDDEN",
    )
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
  if (caller.capabilities) {
    assertCapability(
      caller.capabilities,
      operationForRequest(headerList.get(REQUEST_TARGET_HEADER))
    )
  }
  return caller
}
