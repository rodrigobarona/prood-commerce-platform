import { headers } from "next/headers"
import { auth, type Session } from "./server"

/**
 * Provider-agnostic session accessor (the auth "seam").
 *
 * Server Components / Actions / Route Handlers should call this instead of
 * touching Better Auth directly, so the provider can be swapped (WorkOS / Clerk)
 * without changing callers.
 */
export async function getSession(): Promise<Session | null> {
  return auth.api.getSession({ headers: await headers() })
}

/** Convenience: the current user or null. */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

export { auth } from "./server"
export type { Session, SessionUser } from "./server"
