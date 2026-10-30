import { betterAuth } from "better-auth"
import type { BetterAuthPlugin } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { requiredEnv } from "@prood/types"
import { authDb } from "./db"
import * as schema from "./schema"
import { resolveBetterAuthTrustedOrigins, resolveTrustedOrigins } from "./origins"

export { resolveBetterAuthTrustedOrigins, resolveTrustedOrigins } from "./origins"

export interface CreateAuthOptions {
  /** Plugins inserted after organization/apiKey and before nextCookies. */
  extraPlugins?: BetterAuthPlugin[]
}

/** Shared secret + issuer URL (apps/api) for every Better Auth instance. */
/**
 * API keys belong to a store: the plugin checks membership at creation and
 * stores the organization as `referenceId`, which is the only tenant binding
 * to trust. Metadata is client-supplied and only carries the requested scopes.
 */
export const storeApiKey = () => apiKey({ references: "organization", enableMetadata: true })

export function resolveBetterAuthEnv() {
  return {
    secret: requiredEnv(process.env.BETTER_AUTH_SECRET, "BETTER_AUTH_SECRET"),
    baseURL: requiredEnv(process.env.BETTER_AUTH_URL, "BETTER_AUTH_URL"),
  }
}

/**
 * Canonical Better Auth instance — email/password on shared Neon Postgres,
 * organization plugin, API keys, and optional extra plugins (e.g. agentAuth).
 */
export function createAuth(options: CreateAuthOptions = {}) {
  const { baseURL, secret } = resolveBetterAuthEnv()
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
      storeApiKey(),
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
