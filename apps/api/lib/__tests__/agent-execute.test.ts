import { APIError } from "better-auth/api"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getMemberRole: vi.fn(),
  getOrganizationLimits: vi.fn(),
  resolveOrgForAgent: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/org-plan", () => ({ getOrganizationLimits: mocks.getOrganizationLimits }))
vi.mock("@/lib/agent-org", () => ({ resolveOrgForAgent: mocks.resolveOrgForAgent }))
vi.mock("@prood/commerce", () => ({
  assertFeature: (enabled: boolean, message: string) => {
    if (!enabled) throw new CommerceError(message, "FORBIDDEN")
  },
}))
vi.mock("@prood/auth/membership", async (importOriginal) => ({
  isStoreAdminRole: (await importOriginal<typeof import("@prood/auth/membership")>()).isStoreAdminRole,
  getMemberRole: mocks.getMemberRole,
}))

import { CommerceError } from "@prood/types"
import { getAgentAuthOpenAPIOptions } from "../auth/agent-config"
import { AGENT_PROXY_HEADER, verifyAgentProxyToken } from "../agent-proxy-token"

const agentSession = (...capabilities: string[]) => ({
  user: { id: "user-1" },
  agent: {
    id: "agent-1",
    capabilityGrants: capabilities.map((capability) => ({ capability, status: "active" })),
  },
})

function execute(capability: string, args?: Record<string, unknown>, grants = agentSession()) {
  return Promise.resolve(
    getAgentAuthOpenAPIOptions().onExecute?.({
      capability,
      arguments: args,
      agentSession: grants,
    } as never),
  )
}

function denial(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (err: unknown) => err as APIError,
  )
}

function sentClaims() {
  const init = mocks.fetch.mock.calls[0]?.[1] as RequestInit
  const headers = init.headers as Record<string, string>
  expect(headers["x-api-key"]).toBeUndefined()
  const token = headers[AGENT_PROXY_HEADER]
  expect(token).toBeTypeOf("string")
  return verifyAgentProxyToken(token!)
}

describe("executing a capability through the plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("API_PUBLIC_URL", "https://api.prood.test")
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret")
    vi.stubGlobal("fetch", mocks.fetch)
    mocks.fetch.mockImplementation(async () => Response.json({ ok: true }))
    mocks.resolveOrgForAgent.mockResolvedValue("org-1")
    mocks.getOrganizationLimits.mockResolvedValue({ agentAuthEnabled: true })
  })

  it("sends an admin's call with a signed token for that one operation, not a store key", async () => {
    mocks.getMemberRole.mockResolvedValue("admin")

    await execute("adminGetDashboard", undefined, agentSession("adminGetDashboard", "listProducts"))

    expect(mocks.getMemberRole).toHaveBeenCalledWith("org-1", "user-1")
    expect(sentClaims()).toMatchObject({
      orgId: "org-1",
      agentId: "agent-1",
      userId: "user-1",
      operation: "adminGetDashboard",
      capabilities: ["adminGetDashboard", "listProducts"],
    })
  })

  it("refuses an admin capability once the user is demoted", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    const err = await denial(execute("adminRefundOrder", { id: "order-1" }, agentSession("adminRefundOrder")))

    expect(err).toBeInstanceOf(APIError)
    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("lets a member's agent use shopper capabilities", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    await execute("listProducts", undefined, agentSession("listProducts"))

    expect(sentClaims()?.operation).toBe("listProducts")
  })

  it("refuses a capability the agent holds no active grant for", async () => {
    mocks.getMemberRole.mockResolvedValue("owner")

    const err = await denial(execute("adminGetDashboard", undefined, agentSession("listProducts")))

    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("leaves a demoted user's admin grants out of the token, so getOrder gets the public view", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    await execute("getOrder", { id: "order-1" }, agentSession("getOrder", "adminGetOrder"))

    expect(sentClaims()?.capabilities).toEqual(["getOrder"])
  })

  it("refuses an agent whose user left the store", async () => {
    mocks.resolveOrgForAgent.mockResolvedValue(null)

    const err = await denial(execute("listProducts", undefined, agentSession("listProducts")))

    expect(err).toBeInstanceOf(APIError)
    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("refuses a store whose plan doesn't include Agent Auth", async () => {
    mocks.getMemberRole.mockResolvedValue("owner")
    mocks.getOrganizationLimits.mockResolvedValue({ agentAuthEnabled: false })

    const err = await denial(execute("adminGetDashboard", undefined, agentSession("adminGetDashboard")))

    expect(err).toBeInstanceOf(APIError)
    expect(err?.status).toBe("FORBIDDEN")
    expect(err?.message).toMatch(/Grow plan/)
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
