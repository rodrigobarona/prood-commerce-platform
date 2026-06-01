import { cache } from "react"
import { connection } from "next/server"
import { headers } from "next/headers"
import { getAuth, type Session } from "./server"

/**
 * Session accessor for route handlers and MCP.
 * Cached per request; awaits `connection()` so Cache Components / PPR does not
 * abort Neon HTTP session lookups.
 */
export const getSession = cache(async function getSession(
  requestHeaders?: Headers
): Promise<Session | null> {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return null
  }
  await connection()
  const headerList = requestHeaders ?? (await headers())
  return getAuth().api.getSession({ headers: headerList })
})

/** The id of the organization (tenant store) the session is acting on. */
export async function getActiveOrganizationId(
  requestHeaders?: Headers
): Promise<string | null> {
  const session = await getSession(requestHeaders)
  return session?.session.activeOrganizationId ?? null
}

/**
 * Active organization for this request, defaulting to the user's first store
 * when the session has none (matches dashboard org switcher behavior).
 */
export const resolveActiveOrganizationId = cache(
  async function resolveActiveOrganizationId(
    requestHeaders?: Headers
  ): Promise<string | null> {
    const session = await getSession(requestHeaders)
    if (!session) return null

    const existing = session.session.activeOrganizationId
    if (existing) return existing

    const headerList = requestHeaders ?? (await headers())
    await connection()

    let orgs
    try {
      orgs = await getAuth().api.listOrganizations({ headers: headerList })
    } catch {
      return null
    }

    const first = orgs[0]
    if (!first) return null

    try {
      await getAuth().api.setActiveOrganization({
        headers: headerList,
        body: { organizationId: first.id },
      })
    } catch {
      /* DB unavailable — still scope this request to the first store. */
    }

    return first.id
  }
)

export { getAuth } from "./server"
export type { Session, SessionUser } from "./server"
