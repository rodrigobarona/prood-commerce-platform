import type { AgentSession } from "@better-auth/agent-auth"
import { and, eq } from "drizzle-orm"
import { authDb } from "@/lib/auth/db"
import { member } from "@/lib/auth/schema"

/**
 * The store an agent acts for. Agents declare it in their metadata at
 * registration, which is client-controlled, so it is only honoured when the
 * agent's user is a member of that organization.
 */
export async function resolveOrgForAgent(session: AgentSession): Promise<string | null> {
  const meta = session.agent.metadata as { organizationId?: unknown } | null
  const orgId = typeof meta?.organizationId === "string" ? meta.organizationId : null
  const userId = session.user?.id
  if (!orgId || !userId) return null

  const rows = await authDb
    .select({ id: member.id })
    .from(member)
    .where(and(eq(member.userId, userId), eq(member.organizationId, orgId)))
    .limit(1)

  return rows[0] ? orgId : null
}
