import { createFromOpenAPI } from "@better-auth/agent-auth/openapi"
import { buildOpenApiDocument } from "../openapi"

function parseProxyKeysByOrg(): Record<string, string> {
  const raw = process.env.AGENT_PROXY_API_KEYS_BY_ORG
  if (!raw) return {}
  const parsed = JSON.parse(raw) as unknown
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("AGENT_PROXY_API_KEYS_BY_ORG must be a JSON object")
  }
  return Object.fromEntries(
    Object.entries(parsed).filter(
      (entry): entry is [string, string] =>
        typeof entry[0] === "string" && typeof entry[1] === "string"
    )
  )
}

/** Public base URL for REST + agent OpenAPI proxy (must include `/v1`). */
export function getApiPublicBaseUrl(): string {
  const root =
    process.env.API_PUBLIC_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3005"
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
    defaultHostCapabilities: ["GET", "HEAD"],
    approvalStrength: {
      GET: "session",
      HEAD: "session",
      POST: "session",
      PATCH: "session",
      PUT: "session",
      DELETE: "session",
    },
    async resolveHeaders({ agentSession }) {
      const metadata = agentSession.agent.metadata as { organizationId?: string } | null
      const orgId = metadata?.organizationId
      if (!orgId) {
        throw new Error(
          "Agent metadata must include organizationId for OpenAPI capability proxy execution"
        )
      }

      const proxyKey = parseProxyKeysByOrg()[orgId]
      if (proxyKey) return { "x-api-key": proxyKey }

      throw new Error(
        `No proxy API key configured for organization ${orgId}. Set AGENT_PROXY_API_KEYS_BY_ORG.`
      )
    },
  })
}
