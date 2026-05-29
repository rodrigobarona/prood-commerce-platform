import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { agentAuth } from "@better-auth/agent-auth"
import { authDb } from "./db"
import { getAgentAuthOpenAPIOptions } from "./agent-config"
import * as schema from "./schema"

/**
 * Better Auth instance for the API app — email/password on the shared Neon
 * Postgres database (same tables as dashboard/storefront), plus:
 * - organization() so a session resolves to an active tenant store, and
 * - apiKey() so machine/agent callers authenticate with per-tenant API keys.
 *
 * The owning organization + granted scopes are stored in each key's metadata,
 * so verification yields a single tenant (see lib/auth-tenant.ts).
 */
function createAuth() {
  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    plugins: [
      organization(),
      apiKey(),
      agentAuth({
        modes: ["delegated", "autonomous"],
        deviceAuthorizationPage:
          process.env.AGENT_DEVICE_AUTH_PAGE ?? "/device/capabilities",
        trustProxy: process.env.TRUST_PROXY === "true",
        ...getAgentAuthOpenAPIOptions(),
      }),
      nextCookies(),
    ],
  })
}

// Lazily constructed so the instance (and its env validation) is initialized at
// request time only — never during the static build, where BETTER_AUTH_SECRET
// and BETTER_AUTH_URL are intentionally absent.
let instance: ReturnType<typeof createAuth> | null = null

/** The shared Better Auth instance for this app. */
export function getAuth(): ReturnType<typeof createAuth> {
  return (instance ??= createAuth())
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]
export type SessionUser = Session["user"]
