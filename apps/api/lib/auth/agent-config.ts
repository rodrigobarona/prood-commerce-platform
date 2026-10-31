import { createFromOpenAPI } from "@better-auth/agent-auth/openapi"
import { APIError } from "better-auth/api"
import { isCommerceError, requiredEnv } from "@prood/types"
import { buildOpenApiDocument } from "../openapi"
import { resolveAgentAccess } from "../agent-access"
import { capabilitiesForRole } from "../scopes"

/** Granted without merchant approval, so only data any shopper can already see. */
const DEFAULT_CAPABILITIES = new Set([
  "listProducts",
  "getProduct",
  "getProductBySlug",
  "listCategories",
  "getStore",
  "listCountries",
])

let cachedProxyKeysByOrg: Record<string, string> | null = null

/** `AGENT_PROXY_API_KEYS_BY_ORG`: JSON object of organization id → API key. */
function parseProxyKeysByOrg(): Record<string, string> {
  if (cachedProxyKeysByOrg) return cachedProxyKeysByOrg
  const raw = requiredEnv(process.env.AGENT_PROXY_API_KEYS_BY_ORG, "AGENT_PROXY_API_KEYS_BY_ORG")
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error("AGENT_PROXY_API_KEYS_BY_ORG must be valid JSON")
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("AGENT_PROXY_API_KEYS_BY_ORG must be a JSON object")
  }
  cachedProxyKeysByOrg = Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
  return cachedProxyKeysByOrg
}

/** Public base URL for REST + agent OpenAPI proxy (must include `/v1`). */
export function getApiPublicBaseUrl(): string {
  const root = requiredEnv(process.env.API_PUBLIC_URL, "API_PUBLIC_URL")
  return `${root.replace(/\/$/, "")}/v1`
}

/**
 * Agent Auth options derived from the Commerce OpenAPI document.
 * Capabilities map 1:1 to `operationId` values in `lib/openapi.ts`.
 */
export function getAgentAuthOpenAPIOptions() {
  const spec = buildOpenApiDocument()
  return createFromOpenAPI(spec, {
    baseUrl: getApiPublicBaseUrl(),
    defaultHostCapabilities: (cap) => DEFAULT_CAPABILITIES.has(cap.name),
    approvalStrength: {
      GET: "session",
      HEAD: "session",
      POST: "session",
      PATCH: "session",
      PUT: "session",
      DELETE: "session",
    },
    // The plugin has checked the grant and `/v1` only sees the store's key, so
    // this is the one place the user behind the agent can be checked.
    async resolveHeaders({ agentSession, capability }) {
      const { orgId, role, capabilities } = await resolveAgentAccess(agentSession).catch((err: unknown) => {
        if (isCommerceError(err)) throw new APIError("FORBIDDEN", { message: err.message })
        throw err
      })
      if (capabilitiesForRole([capability], role).length === 0) {
        throw new APIError("FORBIDDEN", {
          message: `This agent's user can't use the ${capability} capability.`,
        })
      }

      // `/v1` would see the store's key and return the whole order, not the
      // public view a bearer token gets.
      if (capability === "getOrder" && !capabilities.includes("adminGetOrder")) {
        throw new APIError("FORBIDDEN", {
          message: "This agent doesn't have the adminGetOrder capability.",
        })
      }

      const proxyKey = parseProxyKeysByOrg()[orgId]
      if (proxyKey) return { "x-api-key": proxyKey }

      throw new Error(
        `No proxy API key configured for organization ${orgId}. Set AGENT_PROXY_API_KEYS_BY_ORG.`
      )
    },
  })
}
