import { cache } from "react"
import { connection } from "next/server"
import { headers } from "next/headers"
import { getAuth, type Session } from "./server"

/**
 * Session accessor for server components, actions, and route handlers.
 * Better Auth is the only supported provider.
 *
 * Wrapped in cache() so layout + page share one DB round-trip per request.
 * Awaits connection() so Cache Components / PPR does not abort fetches
 * during prerender.
 */
export const getSession = cache(async function getSession(): Promise<Session | null> {
  await connection()
  if (process.env.NEXT_PHASE === "phase-production-build") return null
  return getAuth().api.getSession({ headers: await headers() })
})

/** Convenience: the current user or null. */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export { getAuth } from "./server"
export type { Session, SessionUser } from "./server"
