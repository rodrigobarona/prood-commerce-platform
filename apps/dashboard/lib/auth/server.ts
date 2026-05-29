import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { organization } from "better-auth/plugins"
import { authDb } from "./db"
import * as schema from "./schema"

/**
 * Better Auth instance for the dashboard — email/password on the shared Neon
 * Postgres database (same tables as the storefront) plus the organization
 * plugin. Each organization models one tenant store; merchants belong to one or
 * more organizations and switch the active one to administer that store.
 *
 * To swap the provider (WorkOS / Clerk), implement the same `getSession()` seam
 * in `./index.ts`; pages and components only depend on that seam.
 */
export const auth = betterAuth({
  database: drizzleAdapter(authDb, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // organization() registers the tenant tables; nextCookies() must remain last
  // so Set-Cookie works inside Server Actions.
  plugins: [organization(), nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]
