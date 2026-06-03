import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, organization } from "better-auth/plugins"
import { apiKey } from "@better-auth/api-key"
import { authDb } from "@prood/auth/db"
import * as schema from "@prood/auth/schema"
import {
  resolveBetterAuthTrustedOrigins,
  resolveBetterAuthEnv,
} from "@prood/auth/server"
import type { Session, SessionUser } from "@prood/auth/server"

function createAdminAuth() {
  const apiBaseUrl =
    process.env.API_PUBLIC_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    "http://localhost:3005"
  const adminBaseUrl =
    process.env.NEXT_PUBLIC_ADMIN_URL?.trim() ?? "http://localhost:3006"
  const { secret } = resolveBetterAuthEnv(apiBaseUrl)
  const cookieDomain = process.env.AUTH_COOKIE_DOMAIN?.trim()

  return betterAuth({
    database: drizzleAdapter(authDb, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    baseURL: adminBaseUrl,
    secret,
    trustedOrigins: resolveBetterAuthTrustedOrigins,
    advanced: cookieDomain
      ? { crossSubDomainCookies: { enabled: true, domain: cookieDomain } }
      : undefined,
    plugins: [organization(), apiKey(), admin({ defaultRole: "user" }), nextCookies()],
  })
}

let instance: ReturnType<typeof createAdminAuth> | null = null

export function getAuth(): ReturnType<typeof createAdminAuth> {
  return (instance ??= createAdminAuth())
}

export type { Session, SessionUser }
