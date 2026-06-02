import { cache } from "react"
import { connection } from "next/server"
import { headers } from "next/headers"
import type { AuthInstance, Session } from "./server"

/**
 * Session accessor for server components, actions, and route handlers.
 * Pass a getter from `createAuthGetter()` in each app.
 *
 * Wrapped in `cache()` so layout + page share one DB round-trip per request.
 * Awaits `connection()` so Cache Components / PPR does not abort Neon HTTP
 * fetches during prerender (see Next.js `connection()` docs).
 */
export const getSession = cache(async function getSession(
  getAuth: () => AuthInstance,
  requestHeaders?: Headers
): Promise<Session | null> {
  await connection()
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }
  const headerList = requestHeaders ?? (await headers())
  return getAuth().api.getSession({ headers: headerList })
})

/** The id of the organization (tenant store) the session is acting on. */
export async function getActiveOrganizationId(
  getAuth: () => AuthInstance
): Promise<string | null> {
  const session = await getSession(getAuth)
  return session?.session.activeOrganizationId ?? null
}

export type { AuthInstance, Session, SessionUser } from "./server"
export {
  createAuth,
  createAuthGetter,
  resolveBetterAuthEnv,
  resolveBetterAuthTrustedOrigins,
  resolveTrustedOrigins,
} from "./server"
export {
  isLocalDevOrigin,
  isTrustedAuthOrigin,
} from "./origins"
export { createAppAuthClient, type AppAuthClient } from "./client"
export { authDb } from "./db"
export * from "./schema"
