import { and, eq } from "drizzle-orm"
import { authDb } from "./db"
import { member } from "./schema"

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
