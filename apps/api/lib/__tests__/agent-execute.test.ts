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

const agentSession = (...capabilities: string[]) => ({
  user: { id: "user-1" },
  agent: {
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

describe("executing a capability through the plugin", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("API_PUBLIC_URL", "https://api.prood.test")
    vi.stubEnv("AGENT_PROXY_API_KEYS_BY_ORG", JSON.stringify({ "org-1": "proxy-key" }))
    vi.stubGlobal("fetch", mocks.fetch)
    mocks.fetch.mockImplementation(async () => Response.json({ ok: true }))
    mocks.resolveOrgForAgent.mockResolvedValue("org-1")
    mocks.getOrganizationLimits.mockResolvedValue({ agentAuthEnabled: true })
  })

  it("sends an admin's call with the store's key", async () => {
    mocks.getMemberRole.mockResolvedValue("admin")

    await execute("adminGetDashboard")

    expect(mocks.getMemberRole).toHaveBeenCalledWith("org-1", "user-1")
    const init = mocks.fetch.mock.calls[0]?.[1] as RequestInit
    expect(init.headers).toMatchObject({ "x-api-key": "proxy-key" })
  })

  it("refuses an admin capability once the user is demoted", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    const err = await denial(execute("adminRefundOrder", { id: "order-1" }))

    expect(err).toBeInstanceOf(APIError)
    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("lets a member's agent use shopper capabilities", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    await execute("listProducts")

    expect(mocks.fetch).toHaveBeenCalledOnce()
  })

  it("refuses getOrder without adminGetOrder, since the store's key reads the whole order", async () => {
    mocks.getMemberRole.mockResolvedValue("owner")

    const err = await denial(
      execute("getOrder", { id: "order-1" }, agentSession("getOrder", "adminGetDashboard")),
    )

    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("allows getOrder with adminGetOrder", async () => {
    mocks.getMemberRole.mockResolvedValue("owner")

    await execute("getOrder", { id: "order-1" }, agentSession("getOrder", "adminGetOrder"))

    expect(mocks.fetch).toHaveBeenCalledOnce()
  })

  it("refuses getOrder when a demotion takes adminGetOrder away", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    const err = await denial(
      execute("getOrder", { id: "order-1" }, agentSession("getOrder", "adminGetOrder")),
    )

    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("refuses an agent whose user left the store", async () => {
    mocks.resolveOrgForAgent.mockResolvedValue(null)

    const err = await denial(execute("listProducts"))

    expect(err).toBeInstanceOf(APIError)
    expect(err?.status).toBe("FORBIDDEN")
    expect(mocks.fetch).not.toHaveBeenCalled()
  })

  it("refuses a store whose plan doesn't include Agent Auth", async () => {
    mocks.getMemberRole.mockResolvedValue("owner")
    mocks.getOrganizationLimits.mockResolvedValue({ agentAuthEnabled: false })

    const err = await denial(execute("adminGetDashboard"))

    expect(err).toBeInstanceOf(APIError)
    expect(err?.status).toBe("FORBIDDEN")
    expect(err?.message).toMatch(/Grow plan/)
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
