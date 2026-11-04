import { createFromOpenAPI } from "@better-auth/agent-auth/openapi"
import { APIError } from "better-auth/api"
import { isCommerceError, requiredEnv } from "@prood/types"
import { AGENT_PROXY_HEADER, signAgentProxyToken } from "../agent-proxy-token"
import { buildOpenApiDocument } from "../openapi"
import { resolveAgentAccess } from "../agent-access"

/** Granted without merchant approval, so only data any shopper can already see. */
const DEFAULT_CAPABILITIES = new Set([
  "listProducts",
  "getProduct",
  "getProductBySlug",
  "listCategories",
  "getStore",
  "listCountries",
])

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
    // The plugin has checked the grant, so this is where the user behind the
    // agent is checked: still in the store, on a plan with Agent Auth, and
    // with a role that allows the capability. `/v1` gets a signed token for
    // this one operation instead of a store API key.
    async resolveHeaders({ agentSession, capability }) {
      const { orgId, capabilities } = await resolveAgentAccess(agentSession).catch((err: unknown) => {
        if (isCommerceError(err)) throw new APIError("FORBIDDEN", { message: err.message })
        throw err
      })
      if (!capabilities.includes(capability)) {
        throw new APIError("FORBIDDEN", {
          message: `This agent's user can't use the ${capability} capability.`,
        })
      }
      return {
        [AGENT_PROXY_HEADER]: signAgentProxyToken({
          orgId,
          agentId: agentSession.agent.id,
          userId: agentSession.user?.id,
          operation: capability,
          capabilities,
        }),
      }
    },
  })
}
