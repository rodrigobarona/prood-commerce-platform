import { eq, lt } from "drizzle-orm"
import { authDb } from "./db"
import { adminAuditEvent, agentEvent, invitation, member, organization, session, verification } from "./schema"

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Published in the privacy policy and the data processing terms, and recorded in
 * `_docs/compliance/retention-schedule.md`. Change them together.
 */
export const RETENTION_DAYS = {
  /** Sessions and verification links are deleted once they expire. */
  expiredSessions: 0,
  expiredVerifications: 0,
  /** A team invitation that nobody accepted, counted from when it expired. */
  expiredInvitations: 30,
  /** What an AI agent did on a store: type, capability, status, never its data. 24 months. */
  agentEvents: 730,
  /** What administrators did to accounts, 24 months. */
  adminAuditEvents: 730,
} as const

const before = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS)

/** Deletes everything past its retention period. Safe to run again at any time. */
export async function purgeExpiredAuthData(now = new Date()): Promise<Record<string, number>> {
  const sessions = await authDb
    .delete(session)
    .where(lt(session.expiresAt, before(now, RETENTION_DAYS.expiredSessions)))
    .returning({ id: session.id })

  const verifications = await authDb
    .delete(verification)
    .where(lt(verification.expiresAt, before(now, RETENTION_DAYS.expiredVerifications)))
    .returning({ id: verification.id })

  const invitations = await authDb
    .delete(invitation)
    .where(lt(invitation.expiresAt, before(now, RETENTION_DAYS.expiredInvitations)))
    .returning({ id: invitation.id })

  const events = await authDb
    .delete(agentEvent)
    .where(lt(agentEvent.createdAt, before(now, RETENTION_DAYS.agentEvents)))
    .returning({ id: agentEvent.id })

  const adminEvents = await authDb
    .delete(adminAuditEvent)
    .where(lt(adminAuditEvent.createdAt, before(now, RETENTION_DAYS.adminAuditEvents)))
    .returning({ id: adminAuditEvent.id })

  return {
    adminAuditEvents: adminEvents.length,
    sessions: sessions.length,
    verifications: verifications.length,
    invitations: invitations.length,
    agentEvents: events.length,
  }
}

/** Stores where this person is the only owner. Deleting their account would leave the store with nobody to run it. */
export async function listSoleOwnedStores(userId: string): Promise<{ id: string; name: string }[]> {
  const owned = await authDb
    .select({ id: organization.id, name: organization.name, role: member.role })
    .from(member)
    .innerJoin(organization, eq(member.organizationId, organization.id))
    .where(eq(member.userId, userId))
  const mine = owned.filter((row) => hasOwnerRole(row.role))
  const sole: { id: string; name: string }[] = []
  for (const store of mine) {
    const members = await authDb
      .select({ userId: member.userId, role: member.role })
      .from(member)
      .where(eq(member.organizationId, store.id))
    const owners = members.filter((row) => hasOwnerRole(row.role))
    if (owners.length === 1) sole.push({ id: store.id, name: store.name })
  }
  return sole
}

/** Better Auth joins multiple roles with commas. */
function hasOwnerRole(role: string | null): boolean {
  return (role ?? "").split(",").some((name) => name.trim() === "owner")
}
