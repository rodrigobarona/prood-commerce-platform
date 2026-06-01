import { headers } from "next/headers"
import type { AuthInstance, Session } from "./server"

/**
 * Session accessor for server components, actions, and route handlers.
 * Pass a getter from `createAuthGetter()` in each app.
 */
export async function getSession(
  getAuth: () => AuthInstance
): Promise<Session | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }
  return getAuth().api.getSession({ headers: await headers() })
}

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
export {
  createAppAuthClient,
  getAppAuthClient,
  resolvePublicAuthBaseUrl,
  resolveServerPublicAuthBaseUrl,
} from "./client"
export { authDb } from "./db"
export * from "./schema"
