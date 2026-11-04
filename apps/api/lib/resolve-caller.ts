import { CommerceError } from "@prood/types"
import { getAuth, getSession, resolveActiveOrganizationId } from "@/lib/auth"
import { getOrganizationLimits } from "@/lib/org-plan"
import { getMemberRole } from "@prood/auth/membership"
import { lookupTenantByHost } from "@prood/platform"
import { resolveAgentAccess } from "@/lib/agent-access"
import {
  assertCapability,
  operationForRequest,
  REQUEST_TARGET_HEADER,
} from "@/lib/agent-capability"
import { assertAgentRate, assertApiKeyRate, countApiKeyRequest, readApiKey } from "@/lib/api-key-limit"
import { AGENT_PROXY_HEADER, verifyAgentProxyToken } from "@/lib/agent-proxy-token"
import { recordAgentCall } from "@/lib/auth/agent-events"
import { hasScope, scopeRefusal, scopesForRole, type ApiScope } from "@/lib/scopes"
import type { ApiCaller } from "@/lib/auth-tenant"

const API_KEY_HEADER = "x-api-key"

function platformDomain(): string {
  const domain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
  if (!domain) throw new Error("NEXT_PUBLIC_PLATFORM_DOMAIN is required")
  return domain
}

function parseApiKeyScopes(metadata: string | null): ApiScope[] {
  let scopes: unknown
  try {
    scopes = (JSON.parse(metadata ?? "null") as { scopes?: unknown } | null)?.scopes
  } catch {
    return ["storefront"]
  }
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
  // Agent Auth's execute endpoint calling `/v1` for an agent. It has already
  // checked the agent, so the token is trusted for its one operation only.
  const proxyToken = headerList.get(AGENT_PROXY_HEADER)
  if (proxyToken) {
    const claims = verifyAgentProxyToken(proxyToken)
    const operation = operationForRequest(headerList.get(REQUEST_TARGET_HEADER))
    if (!claims || claims.operation !== operation) {
      throw new CommerceError("This agent call isn't valid here", "UNAUTHORIZED")
    }
    await assertAgentRate(claims.orgId)
    return {
      orgId: claims.orgId,
      scopes: scopesFromCapabilities(claims.capabilities),
      via: "agent",
      capabilities: claims.capabilities,
      agentId: claims.agentId,
      proxied: true,
    }
  }

  const authorization = headerList.get("authorization")
  if (authorization?.startsWith("Bearer ")) {
    const agentSession = await getAuth().api.getAgentSession({
      headers: headerList,
    })
    if (agentSession) {
      const { orgId, capabilities } = await resolveAgentAccess(agentSession)
      const scopes = scopesFromCapabilities(capabilities)
      if (scopes.length === 0) {
        throw new CommerceError("Agent has no active capability grants", "FORBIDDEN")
      }
      await assertAgentRate(orgId)
      return {
        orgId,
        scopes,
        via: "agent",
        capabilities,
        agentId: agentSession.agent.id,
        actorId: agentSession.user?.id,
      }
    }
  }

  const key = headerList.get(API_KEY_HEADER)
  if (key) {
    const { id, referenceId: orgId, metadata } = await readApiKey(key)
    await assertApiKeyRate(id)
    countApiKeyRequest(id)
    const scopes = parseApiKeyScopes(metadata)
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
      // The store being visited wins over the session's active store, so a
      // merchant shopping elsewhere is a shopper there.
      const role = session?.user ? await getMemberRole(hostOrgId, session.user.id) : null
      return {
        orgId: hostOrgId,
        scopes: role ? scopesForRole(role) : ["storefront"],
        via: session?.user ? "session" : "host",
        userId: session?.user?.id,
      }
    }
  }

  const sessionOrgId = await resolveActiveOrganizationId(headerList)
  if (sessionOrgId && session?.user) {
    const role = await getMemberRole(sessionOrgId, session.user.id)
    if (role) {
      return {
        orgId: sessionOrgId,
        scopes: scopesForRole(role),
        via: "session",
        userId: session.user.id,
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
    throw new CommerceError(
      "Authentication required. Send your API key in the x-api-key header. Create one in your dashboard, under API keys.",
      "UNAUTHORIZED"
    )
  }
  const operation = caller.capabilities ? operationForRequest(headerList.get(REQUEST_TARGET_HEADER)) : null
  // An agent's own calls, refused or not. Calls through the execute endpoint
  // are recorded there, with their outcome.
  const recorded = caller.capabilities && !caller.proxied && caller.agentId ? operation : null
  try {
    if (!hasScope(caller.scopes, scope)) {
      throw new CommerceError(scopeRefusal(scope, caller.via), "FORBIDDEN")
    }
    if (caller.capabilities) assertCapability(caller.capabilities, operation)
  } catch (err) {
    if (recorded) recordAgentCall(caller, recorded, err instanceof Error ? err.message : "Refused")
    throw err
  }
  if (recorded) recordAgentCall(caller, recorded)
  return caller
}
