import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { agentAuth } from "@better-auth/agent-auth"
import {
  resolveBetterAuthEnv,
  resolveBetterAuthTrustedOrigins,
} from "@prood/auth/server"
import { authDb } from "@prood/auth/db"
import * as schema from "@prood/auth/schema"
import { getAgentAuthOpenAPIOptions } from "./agent-config"

/**
 * Better Auth for the API app — uses shared env/origin helpers from
 * `@prood/auth` and adds Agent Auth (typed plugin APIs require a local
 * `betterAuth()` call here).
 */
function createAuth() {
  const { secret } = resolveBetterAuthEnv("http://localhost:3005")
  const baseURL =
    process.env.API_PUBLIC_URL?.trim() ??
    process.env.BETTER_AUTH_URL?.trim() ??
    "http://localhost:3005"
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()

  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    baseURL,
    secret,
    trustedOrigins: resolveBetterAuthTrustedOrigins,
    advanced: cookieDomain
      ? {
          crossSubDomainCookies: {
            enabled: true,
            domain: cookieDomain,
          },
        }
      : undefined,
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

let instance: ReturnType<typeof createAuth> | null = null

/** The shared Better Auth instance for the API app (includes Agent Auth). */
export function getAuth(): ReturnType<typeof createAuth> {
  return (instance ??= createAuth())
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]
export type SessionUser = Session["user"]
