import { headers } from "next/headers"
import {
  getActiveOrganizationId as getActiveOrganizationIdFromPackage,
  getSession as getSessionFromPackage,
} from "@prood/auth"
import { getAuth, type Session } from "./server"

/**
 * Session accessor for server components, actions, and route handlers.
 * Better Auth is the only supported provider.
 */
export async function getSession(): Promise<Session | null> {
  return getSessionFromPackage(getAuth)
}

/** Convenience: the current user or null. */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}

/** The id of the organization (tenant store) the merchant is administering. */
export async function getActiveOrganizationId(): Promise<string | null> {
  return getActiveOrganizationIdFromPackage(getAuth)
}

/** All organizations (tenant stores) the current merchant belongs to. */
export async function listOrganizations() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return []
  }
  return getAuth().api.listOrganizations({ headers: await headers() })
}

/**
 * The active organization with its members and pending invitations, or null if
 * no organization is active.
 */
export async function getFullActiveOrganization() {
  const orgId = await getActiveOrganizationId()
  if (!orgId) return null
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }
  return getAuth().api.getFullOrganization({
    headers: await headers(),
    query: { organizationId: orgId },
  })
}

export { getAuth } from "./server"
export type { Session, SessionUser } from "./server"
