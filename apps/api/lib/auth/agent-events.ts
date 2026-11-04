import type { AgentAuthEvent } from "@better-auth/agent-auth"
import { eq } from "drizzle-orm"
import { after } from "next/server"
import { agentOrganizationId, recordAgentEvent } from "@prood/auth/agent-events"
import { authDb } from "@prood/auth/db"
import { agent } from "@prood/auth/schema"
import type { ApiCaller } from "@/lib/auth-tenant"

async function organizationOfAgent(agentId: string): Promise<string | null> {
  const [row] = await authDb
    .select({ metadata: agent.metadata })
    .from(agent)
    .where(eq(agent.id, agentId))
    .limit(1)
  return agentOrganizationId(row?.metadata ?? null)
}

/**
 * Agent Auth's `onEvent`: everything the plugin does, written to `agent_event`.
 * The plugin doesn't know stores, so the store comes from the agent's approval.
 * Arguments and results are left out, because they can hold customer data.
 */
export async function recordPluginEvent(event: AgentAuthEvent): Promise<void> {
  const organizationId =
    event.orgId ?? (event.agentId ? await organizationOfAgent(event.agentId).catch(() => null) : null)

  if (event.type === "capability.executed") {
    await recordAgentEvent({
      type: event.type,
      organizationId,
      agentId: event.agentId,
      hostId: event.hostId,
      actorId: event.userId ?? event.actorId,
      actorType: event.actorType ?? "agent",
      capability: event.capability,
      status: event.status,
      error: event.error,
      durationMs: event.durationMs,
    })
    return
  }

  // Audit metadata is capability names, counts and reasons. `agent.updated`
  // carries the values the caller sent, which can be anything, so not those.
  const metadata = event.type === "agent.updated" ? undefined : event.metadata
  const target = event.targetId ? { targetId: event.targetId, targetType: event.targetType } : null
  await recordAgentEvent({
    type: event.type,
    organizationId,
    agentId: event.agentId,
    hostId: event.hostId,
    actorId: event.actorId,
    actorType: event.actorType,
    metadata: metadata || target ? { ...metadata, ...target } : null,
  })
}

/**
 * A call an agent made to `/v1` with its own token, written once the response
 * is sent. Its outcome isn't known here, only a refusal, passed as `refused`.
 */
export function recordAgentCall(caller: ApiCaller, operation: string, refused?: string): void {
  after(() =>
    recordAgentEvent({
      type: "capability.called",
      organizationId: caller.orgId,
      agentId: caller.agentId,
      actorId: caller.actorId,
      actorType: "agent",
      capability: operation,
      ...(refused ? { status: "error" as const, error: refused } : {}),
    })
  )
}
