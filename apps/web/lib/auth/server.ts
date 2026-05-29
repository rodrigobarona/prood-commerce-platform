import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { authDb } from "./db"
import * as schema from "./schema"

/**
 * Better Auth instance — email/password on Neon Postgres via Drizzle.
 *
 * This is the default auth provider. To swap to WorkOS AuthKit or Clerk,
 * implement the same `getSession()` seam in `./index.ts` behind an
 * `AUTH_PROVIDER` switch; pages and components only depend on that seam.
 */
export const auth = betterAuth({
  database: drizzleAdapter(authDb, { provider: "pg", schema }),
  emailAndPassword: { enabled: true },
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // nextCookies() must be the last plugin so Set-Cookie works in Server Actions.
  plugins: [nextCookies()],
})

export type Session = typeof auth.$Infer.Session
export type SessionUser = Session["user"]
