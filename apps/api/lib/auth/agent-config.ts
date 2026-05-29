import { createFromOpenAPI } from "@better-auth/agent-auth/openapi"
import { buildOpenApiDocument } from "../openapi"

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
      // Proxy executes against our own REST routes, which expect `x-api-key` or a
      // session cookie. Set AGENT_PROXY_API_KEY to a tenant-scoped API key whose
      // metadata includes `{ organizationId, scopes: ["storefront","admin"] }`.
      const proxyKey = process.env.AGENT_PROXY_API_KEY
      if (proxyKey) {
        return { "x-api-key": proxyKey }
      }

      // Optional: bind org via agent metadata `{ "organizationId": "..." }` and use
      // a per-org key lookup here when you outgrow a single proxy key.
      void agentSession
      throw new Error(
        "AGENT_PROXY_API_KEY is not set — required for OpenAPI capability proxy execution"
      )
    },
  })
}
