import { and, count, eq, gt } from "drizzle-orm"
import { authDb } from "./db"
import { invitation, member } from "./schema"

/**
 * The user's role in a store, or null if they don't belong to it. Read on every
 * request: a session's active organization outlives a removal from the store.
 * Auth tables are private to this connection, so call it outside `withTenant()`.
 */
export async function getMemberRole(
  organizationId: string,
  userId: string
): Promise<string | null> {
  const [row] = await authDb
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)))
    .limit(1)
  return row?.role ?? null
}

/** Owners and admins run the store. Better Auth joins multiple roles with commas. */
export function isStoreAdminRole(role: string | null): boolean {
  return (role ?? "")
    .split(",")
    .some((name) => ["owner", "admin"].includes(name.trim()))
}

/** Only owners can delete a store. Better Auth joins multiple roles with commas. */
export function isStoreOwnerRole(role: string | null): boolean {
  return (role ?? "").split(",").some((name) => name.trim() === "owner")
}

/** People on the store, plus invitations still open: each one takes a seat when accepted. */
export async function countTeamSeats(organizationId: string): Promise<number> {
  const [[members], [invited]] = await Promise.all([
    authDb.select({ value: count() }).from(member).where(eq(member.organizationId, organizationId)),
    authDb
      .select({ value: count() })
      .from(invitation)
      .where(
        and(
          eq(invitation.organizationId, organizationId),
          eq(invitation.status, "pending"),
          gt(invitation.expiresAt, new Date())
        )
      ),
  ])
  return (members?.value ?? 0) + (invited?.value ?? 0)
}
