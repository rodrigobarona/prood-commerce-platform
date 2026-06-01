import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins"
import { authDb } from "./db"
import * as schema from "./schema"

const BUILD_FALLBACK_SECRET =
  "7f3c9a2e8b1d4f6a0c5e9b2d8f1a4c6e9b0d3f7a2c5e8b1d4f6a0c5e9b2d8f1a4c6"

function resolveBaseUrl(defaultBaseUrl: string, isBuild: boolean): string | undefined {
  const explicit = process.env.BETTER_AUTH_URL?.trim()
  if (explicit) return explicit

  const vercelHost = process.env.VERCEL_URL?.trim()
  if (vercelHost) return `https://${vercelHost}`

  return isBuild ? defaultBaseUrl : undefined
}

function resolveBetterAuthEnv(defaultBaseUrl: string) {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  const baseURL = resolveBaseUrl(defaultBaseUrl, isBuild)

  if (isBuild && !secret) {
    return {
      baseURL: baseURL ?? defaultBaseUrl,
      secret: BUILD_FALLBACK_SECRET,
    }
  }

  return { baseURL, secret }
}

/**
 * Better Auth instance for the dashboard — email/password on the shared Neon
 * Postgres database (same tables as the storefront) plus the organization
 * plugin. Each organization models one tenant store; merchants belong to one or
 * more organizations and switch the active one to administer that store.
 */
function createAuth() {
  const { baseURL, secret } = resolveBetterAuthEnv("http://localhost:3002")
  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    baseURL,
    secret,
    // organization() registers the tenant tables; nextCookies() must remain last
    // so Set-Cookie works inside Server Actions.
    plugins: [organization(), nextCookies()],
  })
}

let instance: ReturnType<typeof createAuth> | null = null

export function getAuth(): ReturnType<typeof createAuth> {
  return (instance ??= createAuth())
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]
export type SessionUser = Session["user"]
