import type { AgentSession } from "@better-auth/agent-auth"
import { eq } from "drizzle-orm"
import { authDb } from "@/lib/auth/db"
import { member } from "@prood/auth/schema"

/**
 * The store an agent acts for: the one it was approved for in the dashboard,
 * or the user's only store. Metadata is re-checked against membership on every
 * request, so losing access to a store also cuts off the agent.
 */
export async function resolveOrgForAgent(session: AgentSession): Promise<string | null> {
  const userId = session.user?.id
  if (!userId) return null

  const memberships = await authDb
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId))
  const stores = memberships.map((m) => m.organizationId)

  const meta = session.agent.metadata as { organizationId?: unknown } | null
  if (typeof meta?.organizationId === "string") {
    return stores.includes(meta.organizationId) ? meta.organizationId : null
  }
  return stores.length === 1 ? (stores[0] ?? null) : null
}
