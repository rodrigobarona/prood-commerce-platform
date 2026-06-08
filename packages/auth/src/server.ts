import { betterAuth } from "better-auth"
import type { BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { authDb } from "./db"
import * as schema from "./schema"
import { resolveBetterAuthTrustedOrigins, resolveTrustedOrigins } from "./origins"

export { resolveBetterAuthTrustedOrigins, resolveTrustedOrigins } from "./origins"

export interface CreateAuthOptions {
  /** Plugins inserted after organization/apiKey and before nextCookies. */
  extraPlugins?: BetterAuthPlugin[]
  /** Fallback base URL for local development when BETTER_AUTH_URL is unset. */
  defaultBaseUrl?: string
}

export function resolveBetterAuthEnv(defaultBaseUrl: string) {
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is required and must be non-empty")
  }

  const baseURL = process.env.BETTER_AUTH_URL?.trim() || defaultBaseUrl
  return { baseURL, secret }
}

/**
 * Canonical Better Auth instance — email/password on shared Neon Postgres,
 * organization plugin, API keys, and optional extra plugins (e.g. agentAuth).
 */
export function createAuth(options: CreateAuthOptions = {}) {
  const defaultBaseUrl = options.defaultBaseUrl ?? "http://localhost:3005"
  const { baseURL, secret } = resolveBetterAuthEnv(defaultBaseUrl)
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
      admin({
        defaultRole: "user",
      }),
      ...(options.extraPlugins ?? []),
      nextCookies(),
    ],
  })
}

export type AuthInstance = ReturnType<typeof createAuth>
export type Session = AuthInstance["$Infer"]["Session"]
export type SessionUser = Session["user"]

/** Lazily construct a singleton auth instance (one per app process). */
export function createAuthGetter(options: CreateAuthOptions = {}) {
  let instance: AuthInstance | null = null
  return (): AuthInstance => (instance ??= createAuth(options))
}
