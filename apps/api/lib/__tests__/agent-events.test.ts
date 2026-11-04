import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  recordAgentEvent: vi.fn(),
  limit: vi.fn(),
}))

vi.mock("next/server", () => ({ after: (fn: () => unknown) => fn() }))
vi.mock("@prood/auth/agent-events", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@prood/auth/agent-events")>()),
  recordAgentEvent: mocks.recordAgentEvent,
}))
vi.mock("@prood/auth/db", () => ({
  authDb: { select: () => ({ from: () => ({ where: () => ({ limit: mocks.limit }) }) }) },
}))

import { recordPluginEvent } from "../auth/agent-events"

describe("recording Agent Auth events", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.limit.mockResolvedValue([{ metadata: JSON.stringify({ organizationId: "org-1" }) }])
  })

  it("files an execution under the agent's store, without its arguments or result", async () => {
    await recordPluginEvent({
      type: "capability.executed",
      agentId: "agent-1",
      userId: "user-1",
      capability: "adminRefundOrder",
      arguments: { id: "order-1", note: "customer@example.com" },
      output: { contactEmail: "customer@example.com" },
      status: "error",
      error: "Refund failed",
      durationMs: 41.6,
    })

    expect(mocks.recordAgentEvent).toHaveBeenCalledWith({
      type: "capability.executed",
      organizationId: "org-1",
      agentId: "agent-1",
      hostId: undefined,
      actorId: "user-1",
      actorType: "agent",
      capability: "adminRefundOrder",
      status: "error",
      error: "Refund failed",
      durationMs: 41.6,
    })
    expect(JSON.stringify(mocks.recordAgentEvent.mock.calls)).not.toContain("customer@example.com")
  })

  it("keeps an audit event's metadata and target", async () => {
    await recordPluginEvent({
      type: "capability.requested",
      agentId: "agent-1",
      actorId: "user-1",
      actorType: "user",
      targetId: "request-1",
      targetType: "approval",
      metadata: { capabilities: ["adminRefundOrder"] },
    })

    expect(mocks.recordAgentEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        metadata: { capabilities: ["adminRefundOrder"], targetId: "request-1", targetType: "approval" },
      }),
    )
  })

  it("records an event with no store when the agent hasn't been approved for one", async () => {
    mocks.limit.mockResolvedValue([{ metadata: null }])

    await recordPluginEvent({ type: "agent.created", agentId: "agent-1" })

    expect(mocks.recordAgentEvent).toHaveBeenCalledWith(expect.objectContaining({ organizationId: null }))
  })
})
