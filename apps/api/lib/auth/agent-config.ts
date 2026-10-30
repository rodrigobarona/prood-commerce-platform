import { createFromOpenAPI } from "@better-auth/agent-auth/openapi"
import { requiredEnv } from "@prood/types"
import { buildOpenApiDocument } from "../openapi"
import { resolveOrgForAgent } from "../agent-org"

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
  const parsed: unknown = JSON.parse(
    requiredEnv(process.env.AGENT_PROXY_API_KEYS_BY_ORG, "AGENT_PROXY_API_KEYS_BY_ORG")
  )
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
    async resolveHeaders({ agentSession }) {
      const orgId = await resolveOrgForAgent(agentSession)
      if (!orgId) {
        throw new Error("Agent is not bound to a store its user belongs to")
      }

      const proxyKey = parseProxyKeysByOrg()[orgId]
      if (proxyKey) return { "x-api-key": proxyKey }

      throw new Error(
        `No proxy API key configured for organization ${orgId}. Set AGENT_PROXY_API_KEYS_BY_ORG.`
      )
    },
  })
}
