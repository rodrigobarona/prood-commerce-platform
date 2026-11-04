import { authDb } from "./db"
import { agentEvent } from "./schema"

export interface AgentEventInput {
  type: string
  organizationId?: string | null
  agentId?: string | null
  hostId?: string | null
  actorId?: string | null
  actorType?: "user" | "agent" | "system" | null
  capability?: string | null
  status?: "success" | "error" | null
  error?: string | null
  durationMs?: number | null
  metadata?: Record<string, unknown> | null
}

/**
 * Write one agent event. A failed write is logged, never thrown: the audit log
 * mustn't take down the approval or call it records.
 */
export async function recordAgentEvent(input: AgentEventInput): Promise<void> {
  try {
    await authDb.insert(agentEvent).values({
      id: crypto.randomUUID(),
      type: input.type,
      organizationId: input.organizationId ?? null,
      agentId: input.agentId ?? null,
      hostId: input.hostId ?? null,
      actorId: input.actorId ?? null,
      actorType: input.actorType ?? null,
      capability: input.capability ?? null,
      status: input.status ?? null,
      error: input.error ? input.error.slice(0, 500) : null,
      durationMs: input.durationMs == null ? null : Math.round(input.durationMs),
      metadata: input.metadata ?? null,
    })
  } catch (err) {
    console.error(`[agent-events] couldn't record ${input.type}:`, err)
  }
}

/** The store an agent was approved for, from its metadata (a JSON string). */
export function agentOrganizationId(metadata: unknown): string | null {
  let parsed = metadata
  if (typeof metadata === "string") {
    try {
      parsed = JSON.parse(metadata)
    } catch {
      return null
    }
  }
  const organizationId = (parsed as { organizationId?: unknown } | null)?.organizationId
  return typeof organizationId === "string" ? organizationId : null
}
