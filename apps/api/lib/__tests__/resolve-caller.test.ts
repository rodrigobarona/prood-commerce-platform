import { beforeEach, describe, expect, it, vi } from "vitest"
import { CommerceError } from "@prood/types"

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  resolveActiveOrganizationId: vi.fn(),
  getMemberRole: vi.fn(),
  getAgentSession: vi.fn(),
  resolveOrgForAgent: vi.fn(),
  lookupTenantByHost: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: vi.fn() }))
vi.mock("@/lib/auth", () => ({
  getAuth: () => ({ api: { getAgentSession: mocks.getAgentSession } }),
  getSession: mocks.getSession,
  resolveActiveOrganizationId: mocks.resolveActiveOrganizationId,
}))
vi.mock("@/lib/org-plan", () => ({
  getOrganizationLimits: async () => ({ agentAuthEnabled: true, apiWriteEnabled: true }),
}))
vi.mock("@/lib/agent-org", () => ({ resolveOrgForAgent: mocks.resolveOrgForAgent }))
vi.mock("@prood/commerce", () => ({ assertFeature: vi.fn() }))
vi.mock("@prood/platform", () => ({ lookupTenantByHost: mocks.lookupTenantByHost }))
vi.mock("@prood/auth/membership", async (importOriginal) => ({
  isStoreAdminRole: (await importOriginal<typeof import("@prood/auth/membership")>()).isStoreAdminRole,
  getMemberRole: mocks.getMemberRole,
}))

import { requireCallerFromHeaders, resolveCallerFromHeaders } from "../resolve-caller"

function denial(promise: Promise<unknown>) {
  return promise.then(
    () => null,
    (err: unknown) => err as CommerceError,
  )
}

describe("session callers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } })
    mocks.resolveActiveOrganizationId.mockResolvedValue("org-1")
  })

  it.each(["owner", "admin", "owner,member"])("lets %s change the store", async (role) => {
    mocks.getMemberRole.mockResolvedValue(role)

    const caller = await requireCallerFromHeaders(new Headers(), "admin")

    expect(caller.scopes).toEqual(["admin", "staff", "storefront"])
    expect(mocks.getMemberRole).toHaveBeenCalledWith("org-1", "user-1")
  })

  it("lets a member read the store's admin data", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    await expect(requireCallerFromHeaders(new Headers(), "staff")).resolves.toMatchObject({
      orgId: "org-1",
      scopes: ["staff", "storefront"],
    })
  })

  it("refuses a member anything that changes the store", async () => {
    mocks.getMemberRole.mockResolvedValue("member")

    const err = await denial(requireCallerFromHeaders(new Headers(), "admin"))

    expect(err).toBeInstanceOf(CommerceError)
    expect(err?.code).toBe("FORBIDDEN")
    expect(err?.message).toBe("Only store owners and admins can do this.")
  })

  it("doesn't trust the session's active store after removal", async () => {
    mocks.getMemberRole.mockResolvedValue(null)

    const err = await denial(requireCallerFromHeaders(new Headers(), "staff"))

    expect(err?.code).toBe("FORBIDDEN")
  })

  it("treats a removed member on a storefront as a shopper", async () => {
    mocks.getMemberRole.mockResolvedValue(null)
    mocks.lookupTenantByHost.mockResolvedValue("org-2")
    vi.stubEnv("NEXT_PUBLIC_PLATFORM_DOMAIN", "prood.test")

    const caller = await resolveCallerFromHeaders(new Headers({ "x-storefront-host": "shop.test" }))

    expect(caller).toMatchObject({ orgId: "org-2", scopes: ["storefront"] })
  })
})

describe("signed-in callers on a storefront", () => {
  const onStore = new Headers({ "x-storefront-host": "store-b.test:3000" })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("NEXT_PUBLIC_PLATFORM_DOMAIN", "prood.test")
    mocks.getSession.mockResolvedValue({ user: { id: "user-1" } })
    mocks.resolveActiveOrganizationId.mockResolvedValue("org-a")
    mocks.lookupTenantByHost.mockResolvedValue("org-b")
  })

  it("puts a merchant of another store in the visited store, as a shopper", async () => {
    mocks.getMemberRole.mockImplementation(async (orgId: string) =>
      orgId === "org-a" ? "owner" : null
    )

    const caller = await resolveCallerFromHeaders(onStore)

    expect(caller).toEqual({
      orgId: "org-b",
      scopes: ["storefront"],
      via: "session",
      userId: "user-1",
    })
    expect(mocks.lookupTenantByHost).toHaveBeenCalledWith("store-b.test", "prood.test")
  })

  it("doesn't save an active store for someone browsing a storefront", async () => {
    mocks.getMemberRole.mockResolvedValue(null)

    await resolveCallerFromHeaders(onStore)

    expect(mocks.resolveActiveOrganizationId).not.toHaveBeenCalled()
  })

  it("gives a member of the visited store their role there", async () => {
    mocks.getMemberRole.mockImplementation(async (orgId: string) =>
      orgId === "org-b" ? "member" : "owner"
    )

    await expect(resolveCallerFromHeaders(onStore)).resolves.toMatchObject({
      orgId: "org-b",
      scopes: ["staff", "storefront"],
    })
  })

  it("keeps a guest as a guest", async () => {
    mocks.getSession.mockResolvedValue(null)

    await expect(resolveCallerFromHeaders(onStore)).resolves.toEqual({
      orgId: "org-b",
      scopes: ["storefront"],
      via: "host",
      userId: undefined,
    })
    expect(mocks.getMemberRole).not.toHaveBeenCalled()
  })

  it("falls back to the session's store when the host isn't a store", async () => {
    mocks.lookupTenantByHost.mockResolvedValue(null)
    mocks.getMemberRole.mockResolvedValue("owner")

    await expect(resolveCallerFromHeaders(onStore)).resolves.toMatchObject({ orgId: "org-a" })
  })

  it("uses the session's store for dashboard calls with no store host", async () => {
    mocks.getMemberRole.mockResolvedValue("owner")

    await expect(resolveCallerFromHeaders(new Headers())).resolves.toMatchObject({
      orgId: "org-a",
      scopes: ["admin", "staff", "storefront"],
    })
    expect(mocks.lookupTenantByHost).not.toHaveBeenCalled()
  })
})

describe("agents", () => {
  const grants = (...capabilities: string[]) => ({
    user: { id: "user-1" },
    agent: {
      capabilityGrants: capabilities.map((capability) => ({ capability, status: "active" })),
    },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveOrgForAgent.mockResolvedValue("org-1")
  })

  const bearer = new Headers({ authorization: "Bearer token" })

  it("keeps an admin's grants", async () => {
    mocks.getAgentSession.mockResolvedValue(grants("adminRefundOrder", "getOrder"))
    mocks.getMemberRole.mockResolvedValue("admin")

    await expect(resolveCallerFromHeaders(bearer)).resolves.toMatchObject({
      scopes: ["admin", "storefront"],
      capabilities: ["adminRefundOrder", "getOrder"],
    })
  })

  it("drops admin grants from a member's agent, whoever approved them", async () => {
    mocks.getAgentSession.mockResolvedValue(grants("adminRefundOrder", "getOrder"))
    mocks.getMemberRole.mockResolvedValue("member")

    await expect(resolveCallerFromHeaders(bearer)).resolves.toMatchObject({
      scopes: ["storefront"],
      capabilities: ["getOrder"],
    })
  })

  it("refuses a member's agent that only has admin grants", async () => {
    mocks.getAgentSession.mockResolvedValue(grants("adminRefundOrder"))
    mocks.getMemberRole.mockResolvedValue("member")

    expect((await denial(resolveCallerFromHeaders(bearer)))?.code).toBe("FORBIDDEN")
  })
})
