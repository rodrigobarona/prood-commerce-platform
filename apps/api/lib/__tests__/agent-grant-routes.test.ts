import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }))
vi.mock("@prood/auth/db", () => ({ authDb: {} }))
vi.mock("@prood/commerce", () => ({ assertFeature: vi.fn() }))
vi.mock("@prood/platform", () => ({ autoLinkGuestCustomers: vi.fn() }))
vi.mock("../mailer", () => ({ getMailer: vi.fn() }))
vi.mock("../auth/organization-hooks", () => ({ organizationHooks: {} }))
vi.mock("../openapi", () => ({ buildOpenApiDocument: () => ({ paths: {} }) }))
vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory")
  return { drizzleAdapter: () => memoryAdapter({}) }
})

import { getAuth } from "../auth/server"

describe("direct agent grant routes", () => {
  beforeEach(() => {
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-long-enough-for-better-auth")
    vi.stubEnv("BETTER_AUTH_URL", "https://api.prood.test")
    vi.stubEnv("API_PUBLIC_URL", "https://api.prood.test")
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", "https://dashboard.prood.test")
  })

  it.each([
    ["/agent/approve-capability", { action: "approve", agent_id: "agent-1" }],
    ["/agent/grant-capability", { agent_id: "agent-1", capabilities: ["adminRefundOrder"] }],
  ])("refuses %s", async (path, body) => {
    const response = await getAuth().handler(
      new Request(`https://api.prood.test/api/auth${path}`, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://api.prood.test" },
        body: JSON.stringify(body),
      }),
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toMatchObject({
      message: "Approve agents in your dashboard.",
    })
  })

  it("leaves other routes alone", async () => {
    const response = await getAuth().handler(
      new Request("https://api.prood.test/api/auth/ok"),
    )

    expect(response.status).toBe(200)
  })
})
