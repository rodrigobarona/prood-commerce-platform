import { authDb } from "./db"
import { adminAuditEvent } from "./schema"

/** What a Prood administrator can do to someone else's account or a store. Add a value here before recording it. */
export const ADMIN_ACTIONS = [
  "user.ban",
  "user.unban",
  "user.set_role",
  "user.revoke_sessions",
  "session.revoke",
  "agent.revoke",
] as const
export type AdminAction = (typeof ADMIN_ACTIONS)[number]

export interface AdminAuditInput {
  actorId: string
  action: AdminAction
  targetType?: "user" | "session" | "agent" | "organization" | null
  targetId?: string | null
  /** Facts that explain the action, like the new role. Never passwords, tokens or message text. */
  metadata?: Record<string, unknown> | null
  ipAddress?: string | null
}

/**
 * Writes one record of an administrator's action. Call it after the action worked.
 * A failed write is logged loudly, not thrown: the action has already happened,
 * and undoing a ban because the log was down would be worse.
 */
export async function recordAdminAction(input: AdminAuditInput): Promise<void> {
  try {
    await authDb.insert(adminAuditEvent).values({
      id: crypto.randomUUID(),
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? null,
      ipAddress: input.ipAddress ?? null,
    })
  } catch (err) {
    console.error(`[admin-audit] COULD NOT RECORD ${input.action} by ${input.actorId} on ${input.targetId}:`, err)
  }
}
