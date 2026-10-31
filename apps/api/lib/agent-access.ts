import type { AgentSession } from "@better-auth/agent-auth"
import { assertFeature } from "@prood/commerce"
import { getMemberRole } from "@prood/auth/membership"
import { CommerceError } from "@prood/types"
import { resolveOrgForAgent } from "@/lib/agent-org"
import { getOrganizationLimits } from "@/lib/org-plan"
import { capabilitiesForRole } from "@/lib/scopes"

/**
 * The store an agent acts for and what it may do there right now. Read on every
 * call, whether the agent sends a bearer token to `/v1` or goes through the
 * plugin's execute endpoints, because anyone in a store can get an agent
 * approved, so the grant alone proves nothing.
 */
export async function resolveAgentAccess(session: AgentSession) {
  const orgId = await resolveOrgForAgent(session)
  if (!orgId) {
    throw new CommerceError(
      "This agent isn't bound to a store. Approve it in your dashboard.",
      "FORBIDDEN"
    )
  }
  const limits = await getOrganizationLimits(orgId)
  assertFeature(limits.agentAuthEnabled, "Agent Auth requires a Grow plan or higher")
  const role = session.user ? await getMemberRole(orgId, session.user.id) : null
  const capabilities = capabilitiesForRole(
    session.agent.capabilityGrants
      .filter((grant) => grant.status === "active")
      .map((grant) => grant.capability),
    role
  )
  return { orgId, role, capabilities }
}
