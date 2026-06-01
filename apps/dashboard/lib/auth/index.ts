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

/**
 * The id of the organization (tenant store) the merchant is administering.
 * If the session has no active org but the user belongs to at least one store,
 * the first store is selected automatically (same default as the org switcher UI).
 */
export async function getActiveOrganizationId(): Promise<string | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }

  const existing = await getActiveOrganizationIdFromPackage(getAuth)
  if (existing) return existing

  let orgs: Awaited<ReturnType<typeof listOrganizations>>
  try {
    orgs = await listOrganizations()
  } catch {
    return null
  }
  const first = orgs[0]
  if (!first) return null

  try {
    await getAuth().api.setActiveOrganization({
      headers: await headers(),
      body: { organizationId: first.id },
    })
  } catch {
    /* DB unavailable — still scope this request to the first store. */
  }

  return first.id
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
