"use server"

import "server-only"

import { and, eq, inArray } from "drizzle-orm"
import { redirect, unstable_rethrow } from "next/navigation"
import { authDb } from "@/lib/auth/db"
import {
  agent,
  agentCapabilityGrant,
  agentHost,
  approvalRequest,
} from "@/lib/auth/schema"
import { getSession } from "@/lib/auth"
import { changesStore, isFreshSignIn } from "@prood/auth/agent-capabilities"
import { recordAgentEvent } from "@prood/auth/agent-events"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireActiveOrg } from "@/lib/admin"

export interface ApprovalRequestDetails {
  id: string
  status: string
  method: string
  capabilities: string[]
  /** Capabilities in this request that let the agent change the store. */
  storeChanges: string[]
  /** Approving needs a sign-in from the last few minutes, and this session is older. */
  needsFreshSignIn: boolean
  bindingMessage: string | null
  expiresAt: Date
  agent: {
    id: string
    name: string
    mode: string
    status: string
    organizationId: string
  }
  host: {
    id: string
    name: string | null
    status: string
  } | null
}

function parseCapabilities(raw: string | null): string[] {
  return Array.from(new Set(parseCapabilitiesRaw(raw)))
}

function parseCapabilitiesRaw(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.filter((capability): capability is string => typeof capability === "string")
    }
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { capabilities?: unknown }).capabilities)
    ) {
      return (parsed as { capabilities: unknown[] }).capabilities.filter(
        (capability): capability is string => typeof capability === "string"
      )
    }
  } catch {
    return raw
      .split(",")
      .map((capability) => capability.trim())
      .filter(Boolean)
  }
  return []
}

function parseAgentMetadata(raw: string | null): { organizationId?: string } {
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {}
    const organizationId = (parsed as { organizationId?: unknown }).organizationId
    return typeof organizationId === "string" ? { organizationId } : {}
  } catch {
    return {}
  }
}

async function getScopedApprovalRequest(requestId: string) {
  const [session, orgId] = await Promise.all([getSession(), requireActiveOrg()])
  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(`/device/capabilities?request_id=${requestId}`)}`)
  }

  const rows = await authDb
    .select({
      request: approvalRequest,
      agent,
      host: agentHost,
    })
    .from(approvalRequest)
    .leftJoin(agent, eq(approvalRequest.agentId, agent.id))
    .leftJoin(agentHost, eq(approvalRequest.hostId, agentHost.id))
    .where(eq(approvalRequest.id, requestId))
    .limit(1)

  const row = rows[0]
  const requestAgent = row?.agent
  if (!row || !requestAgent) return null

  if (row.request.userId && row.request.userId !== session.user.id) {
    throw new Error("This approval request belongs to a different user.")
  }

  const { organizationId } = parseAgentMetadata(requestAgent.metadata)
  if (organizationId && organizationId !== orgId) {
    throw new Error("This agent belongs to a different store. Switch stores to approve it.")
  }

  return {
    request: row.request,
    agent: requestAgent,
    host: row.host,
    orgId,
    userId: session.user.id,
    signedInAt: new Date(session.session.createdAt),
  }
}

export async function getApprovalRequest(
  requestId: string
): Promise<ApprovalRequestDetails | null> {
  const row = await getScopedApprovalRequest(requestId)
  if (!row) return null

  const capabilities = parseCapabilities(row.request.capabilities)
  const storeChanges = capabilities.filter(changesStore)

  return {
    id: row.request.id,
    status: row.request.status,
    method: row.request.method,
    capabilities,
    storeChanges,
    needsFreshSignIn: storeChanges.length > 0 && !isFreshSignIn(row.signedInAt),
    bindingMessage: row.request.bindingMessage,
    expiresAt: row.request.expiresAt,
    agent: {
      id: row.agent.id,
      name: row.agent.name,
      mode: row.agent.mode,
      status: row.agent.status,
      organizationId: row.orgId,
    },
    host: row.host
      ? {
          id: row.host.id,
          name: row.host.name,
          status: row.host.status,
        }
      : null,
  }
}

export interface ApprovalActionState {
  error?: string
  /** The session is too old to approve store changes; signing in again fixes it. */
  needsFreshSignIn?: boolean
}

const FRESH_SIGN_IN_MESSAGE =
  "This agent could change your store, so approving it needs a sign-in from the last 10 minutes. Sign in again to approve."

async function resolvePendingRequest(requestId: string) {
  const row = await getScopedApprovalRequest(requestId)
  if (!row) throw new Error("Approval request not found.")
  if (row.request.status !== "pending") {
    throw new Error(`Approval request is already ${row.request.status}.`)
  }
  if (row.request.expiresAt.getTime() <= Date.now()) {
    throw new Error("Approval request has expired.")
  }
  return row
}

export async function approveCapabilityRequest(
  requestId: string,
  _state: ApprovalActionState,
  _formData: FormData
): Promise<ApprovalActionState> {
  void _state
  void _formData

  try {
    const row = await resolvePendingRequest(requestId)
    const capabilities = parseCapabilities(row.request.capabilities)
    if (capabilities.length === 0) {
      throw new Error("Approval request does not include any capabilities.")
    }
    if (capabilities.some((capability) => capability.startsWith("admin")) && !(await canManageStore())) {
      return { error: ADMIN_ONLY_MESSAGE }
    }
    if (capabilities.some(changesStore) && !isFreshSignIn(row.signedInAt)) {
      return { error: FRESH_SIGN_IN_MESSAGE, needsFreshSignIn: true }
    }

    const existing = await authDb
      .select({
        id: agentCapabilityGrant.id,
        capability: agentCapabilityGrant.capability,
      })
      .from(agentCapabilityGrant)
      .where(
        and(
          eq(agentCapabilityGrant.agentId, row.agent.id),
          inArray(agentCapabilityGrant.capability, capabilities)
        )
      )

    const existingCapabilities = new Set(existing.map((grant) => grant.capability))
    const now = new Date()

    const grantUpdates = existing.map((grant) =>
      authDb
        .update(agentCapabilityGrant)
        .set({
          status: "active",
          grantedBy: row.userId,
          deniedBy: null,
          reason: null,
          updatedAt: now,
        })
        .where(eq(agentCapabilityGrant.id, grant.id))
    )

    const missingCapabilities = capabilities.filter(
      (capability) => !existingCapabilities.has(capability)
    )
    const grantInserts =
      missingCapabilities.length > 0
        ? [
            authDb.insert(agentCapabilityGrant).values(
              missingCapabilities.map((capability) => ({
                id: crypto.randomUUID(),
                agentId: row.agent.id,
                capability,
                grantedBy: row.userId,
                status: "active",
                createdAt: now,
                updatedAt: now,
              }))
            ),
          ]
        : []

    await authDb.batch([
      authDb
        .update(approvalRequest)
        .set({ status: "approved", updatedAt: now })
        .where(eq(approvalRequest.id, requestId)),
      authDb
        .update(agent)
        .set({
          status: "active",
          activatedAt: now,
          updatedAt: now,
          // Approving binds the agent to this store; the API reads it from here.
          metadata: JSON.stringify({ organizationId: row.orgId }),
        })
        .where(eq(agent.id, row.agent.id)),
      ...grantUpdates,
      ...grantInserts,
    ])
    await recordAgentEvent({
      type: "approval.approved",
      organizationId: row.orgId,
      agentId: row.agent.id,
      hostId: row.agent.hostId,
      actorId: row.userId,
      actorType: "user",
      metadata: { requestId, capabilities },
    })
  } catch (error) {
    unstable_rethrow(error)
    console.error("[approveCapabilityRequest] failed:", error)
    return { error: "We couldn't approve this request. Nothing changed. Try again." }
  }

  redirect("/settings/api-keys")
}

export async function denyCapabilityRequest(
  requestId: string,
  _state: ApprovalActionState,
  formData: FormData
): Promise<ApprovalActionState> {
  try {
    const row = await resolvePendingRequest(requestId)
    const capabilities = parseCapabilities(row.request.capabilities)
    const reason = String(formData.get("reason") ?? "").trim() || "Denied by merchant"
    const now = new Date()

    const existing =
      capabilities.length > 0
        ? await authDb
            .select({
              id: agentCapabilityGrant.id,
              capability: agentCapabilityGrant.capability,
            })
            .from(agentCapabilityGrant)
            .where(
              and(
                eq(agentCapabilityGrant.agentId, row.agent.id),
                inArray(agentCapabilityGrant.capability, capabilities)
              )
            )
        : []

    const existingCapabilities = new Set(existing.map((grant) => grant.capability))

    const grantUpdates = existing.map((grant) =>
      authDb
        .update(agentCapabilityGrant)
        .set({
          status: "denied",
          deniedBy: row.userId,
          reason,
          updatedAt: now,
        })
        .where(eq(agentCapabilityGrant.id, grant.id))
    )

    const missingCapabilities = capabilities.filter(
      (capability) => !existingCapabilities.has(capability)
    )
    const grantInserts =
      missingCapabilities.length > 0
        ? [
            authDb.insert(agentCapabilityGrant).values(
              missingCapabilities.map((capability) => ({
                id: crypto.randomUUID(),
                agentId: row.agent.id,
                capability,
                deniedBy: row.userId,
                status: "denied",
                reason,
                createdAt: now,
                updatedAt: now,
              }))
            ),
          ]
        : []

    await authDb.batch([
      authDb
        .update(approvalRequest)
        .set({ status: "denied", updatedAt: now })
        .where(eq(approvalRequest.id, requestId)),
      authDb
        .update(agent)
        .set({ status: "rejected", updatedAt: now })
        .where(eq(agent.id, row.agent.id)),
      ...grantUpdates,
      ...grantInserts,
    ])
    await recordAgentEvent({
      type: "approval.denied",
      organizationId: row.orgId,
      agentId: row.agent.id,
      hostId: row.agent.hostId,
      actorId: row.userId,
      actorType: "user",
      metadata: { requestId, capabilities, reason },
    })
  } catch (error) {
    unstable_rethrow(error)
    console.error("[denyCapabilityRequest] failed:", error)
    return { error: "We couldn't deny this request. Nothing changed. Try again." }
  }

  redirect("/settings/api-keys")
}
