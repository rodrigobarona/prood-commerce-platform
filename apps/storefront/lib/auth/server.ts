import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { authDb } from "./db"
import * as schema from "./schema"

const BUILD_FALLBACK_SECRET =
  "7f3c9a2e8b1d4f6a0c5e9b2d8f1a4c6e9b0d3f7a2c5e8b1d4f6a0c5e9b2d8f1a4c6"

function resolveBetterAuthEnv(defaultBaseUrl: string) {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"
  const secret = process.env.BETTER_AUTH_SECRET?.trim()
  const baseURL = process.env.BETTER_AUTH_URL?.trim()

  if (isBuild && !secret) {
    return {
      baseURL: baseURL ?? defaultBaseUrl,
      secret: BUILD_FALLBACK_SECRET,
    }
  }

  return { baseURL: baseURL ?? defaultBaseUrl, secret }
}

/**
 * Better Auth instance — email/password on Neon Postgres via Drizzle.
 */
function createAuth() {
  const { baseURL, secret } = resolveBetterAuthEnv("http://localhost:3000")
  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    baseURL,
    secret,
    // nextCookies() must be the last plugin so Set-Cookie works in Server Actions.
    plugins: [nextCookies()],
  })
}

let instance: ReturnType<typeof createAuth> | null = null

export function getAuth(): ReturnType<typeof createAuth> {
  return (instance ??= createAuth())
}

export type Session = ReturnType<typeof createAuth>["$Infer"]["Session"]
export type SessionUser = Session["user"]
