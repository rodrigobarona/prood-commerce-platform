import { cache } from "react"
import { connection } from "next/server"
import { headers } from "next/headers"
import {
  getActiveOrganizationId as getActiveOrganizationIdFromPackage,
  getSession as getSessionFromPackage,
} from "@prood/auth"
import { getMemberRole } from "@prood/auth/membership"
import { getAuth, type Session } from "./server"

/**
 * Session accessor for server components, actions, and route handlers.
 * Better Auth is the only supported provider.
 */
export const getSession = cache(async function getSession(): Promise<Session | null> {
  await connection()
  return getSessionFromPackage(getAuth)
})

/** Convenience: the current user or null. */
export const getCurrentUser = cache(async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
})

/**
 * The id of the organization (tenant store) the merchant is administering.
 * If the session has no active org but the user belongs to at least one store,
 * the first store is selected automatically (same default as the org switcher UI).
 * A session keeps its active organization after its user is removed from that
 * store, so membership is checked on every request.
 */
export const getActiveOrganizationId = cache(
  async function getActiveOrganizationId(): Promise<string | null> {
    await connection()

    if (process.env.NEXT_PHASE === "phase-production-build") {
      return null
    }

    const existing = await getActiveOrganizationIdFromPackage(getAuth)
    const userId = (await getSession())?.user.id
    if (existing && userId && (await getMemberRole(existing, userId))) return existing

    let orgs: Awaited<ReturnType<typeof listOrganizations>>
    try {
      orgs = await listOrganizations()
    } catch (err) {
      console.error("[getActiveOrganizationId] listOrganizations failed:", err)
      return null
    }
    const first = orgs[0]
    if (!first) return null

    try {
      await getAuth().api.setActiveOrganization({
        headers: await headers(),
        body: { organizationId: first.id },
      })
    } catch (err) {
      console.error("[getActiveOrganizationId] setActiveOrganization failed:", err)
    }

    return first.id
  }
)

/** The current merchant's role in the active store, or null if they have none. */
export const getActiveMemberRole = cache(async function getActiveMemberRole(): Promise<string | null> {
  const [orgId, user] = await Promise.all([getActiveOrganizationId(), getCurrentUser()])
  return orgId && user ? getMemberRole(orgId, user.id) : null
})

/** All organizations (tenant stores) the current merchant belongs to. */
export const listOrganizations = cache(async function listOrganizations() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return []
  }
  await connection()
  return getAuth().api.listOrganizations({ headers: await headers() })
})

/**
 * The active organization with its members and pending invitations, or null if
 * no organization is active.
 */
export const getFullActiveOrganization = cache(
  async function getFullActiveOrganization() {
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
)

export { getAuth } from "./server"
export type { Session, SessionUser } from "./server"
