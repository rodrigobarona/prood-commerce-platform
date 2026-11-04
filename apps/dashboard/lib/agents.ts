import "server-only"
import { and, desc, eq, inArray, sql } from "drizzle-orm"
import { agentOrganizationId, recordAgentEvent } from "@prood/auth/agent-events"
import { getSession } from "@/lib/auth"
import { authDb } from "@/lib/auth/db"
import { agent, agentCapabilityGrant, agentEvent, agentHost, user } from "@/lib/auth/schema"
import { requireStoreAdmin } from "@/lib/admin"

export interface StoreAgent {
  id: string
  name: string
  status: string
  mode: string
  hostName: string | null
  userName: string | null
  /** Who granted its access, from the grants. The agent may have no owner. */
  approvedBy: string | null
  capabilities: string[]
  lastUsedAt: Date | null
  createdAt: Date
}

export interface StoreAgentEvent {
  id: string
  agentId: string | null
  type: string
  agentName: string | null
  capability: string | null
  status: string | null
  error: string | null
  createdAt: Date
}

/**
 * The agents approved for the active store. Approval writes the store into the
 * agent's metadata, a JSON string, so that's what scopes them. Not the owner's
 * membership: an autonomous agent can have no owner and still hold grants here.
 * Only approval writes it (the API refuses metadata on `/agent/update`), always
 * as `{"organizationId":"..."}`, so the match is exact and runs before the
 * limit. The parsed metadata is checked again below.
 */
/** The newest agents shown, so a long history doesn't slow the page. */
const STORE_AGENTS_SHOWN = 50

export async function listStoreAgents(): Promise<StoreAgent[]> {
  const orgId = await requireStoreAdmin()
  const rows = await authDb
    .select({
      id: agent.id,
      name: agent.name,
      status: agent.status,
      mode: agent.mode,
      metadata: agent.metadata,
      lastUsedAt: agent.lastUsedAt,
      createdAt: agent.createdAt,
      hostName: agentHost.name,
      userName: user.name,
      userEmail: user.email,
    })
    .from(agent)
    .leftJoin(agentHost, eq(agentHost.id, agent.hostId))
    .leftJoin(user, eq(user.id, agent.userId))
    .where(eq(agent.metadata, JSON.stringify({ organizationId: orgId })))
    .orderBy(desc(agent.createdAt))
    .limit(STORE_AGENTS_SHOWN)

  const agents = rows.filter((row) => agentOrganizationId(row.metadata) === orgId)
  if (agents.length === 0) return []

  const grants = await authDb
    .select({
      agentId: agentCapabilityGrant.agentId,
      capability: agentCapabilityGrant.capability,
      grantedByName: user.name,
      grantedByEmail: user.email,
    })
    .from(agentCapabilityGrant)
    .leftJoin(user, eq(user.id, agentCapabilityGrant.grantedBy))
    .where(
      and(
        inArray(
          agentCapabilityGrant.agentId,
          agents.map((a) => a.id)
        ),
        eq(agentCapabilityGrant.status, "active")
      )
    )
  const byAgent = new Map<string, string[]>()
  const approver = new Map<string, string>()
  for (const grant of grants) {
    byAgent.set(grant.agentId, [...(byAgent.get(grant.agentId) ?? []), grant.capability])
    const name = grant.grantedByName || grant.grantedByEmail
    if (name) approver.set(grant.agentId, name)
  }

  return agents.map((row) => ({
    id: row.id,
    name: row.name,
    status: row.status,
    mode: row.mode,
    hostName: row.hostName,
    userName: row.userName || row.userEmail,
    approvedBy: approver.get(row.id) ?? null,
    capabilities: (byAgent.get(row.id) ?? []).sort(),
    lastUsedAt: row.lastUsedAt,
    createdAt: row.createdAt,
  }))
}

/** The store's latest agent activity, newest first. */
export async function listStoreAgentEvents(limit = 20): Promise<StoreAgentEvent[]> {
  const orgId = await requireStoreAdmin()
  return authDb
    .select({
      id: agentEvent.id,
      type: agentEvent.type,
      agentId: agentEvent.agentId,
      agentName: agent.name,
      capability: agentEvent.capability,
      status: agentEvent.status,
      error: agentEvent.error,
      createdAt: agentEvent.createdAt,
    })
    .from(agentEvent)
    .leftJoin(agent, eq(agent.id, agentEvent.agentId))
    .where(eq(agentEvent.organizationId, orgId))
    .orderBy(desc(agentEvent.createdAt))
    .limit(limit)
}

/** Turn off an agent approved for the active store, and every grant it holds. */
export async function revokeStoreAgent(agentId: string): Promise<void> {
  const [orgId, session] = await Promise.all([requireStoreAdmin(), getSession()])
  const [row] = await authDb
    .select({ metadata: agent.metadata, hostId: agent.hostId })
    .from(agent)
    .where(eq(agent.id, agentId))
    .limit(1)
  if (!row || agentOrganizationId(row.metadata) !== orgId) {
    throw new Error("This agent isn't connected to your store.")
  }

  const now = new Date()
  await authDb.batch([
    // Grants first, while the agent row still matches; both only touch it if
    // it's still bound to this store, in case it was rebound since the read.
    authDb
      .update(agentCapabilityGrant)
      .set({ status: "revoked", updatedAt: now })
      .where(
        and(
          eq(agentCapabilityGrant.agentId, agentId),
          eq(agentCapabilityGrant.status, "active"),
          sql`exists (select 1 from ${agent} where ${agent.id} = ${agentId} and ${agent.metadata} = ${row.metadata})`
        )
      ),
    authDb
      .update(agent)
      .set({ status: "revoked", updatedAt: now })
      .where(and(eq(agent.id, agentId), eq(agent.metadata, row.metadata!))),
  ])
  await recordAgentEvent({
    type: "agent.revoked",
    organizationId: orgId,
    agentId,
    hostId: row.hostId,
    actorId: session?.user.id,
    actorType: "user",
  })
}
