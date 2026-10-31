import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  autoLinkGuestCustomers: vi.fn(),
  getMailer: vi.fn(),
  send: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }))
vi.mock("@prood/auth/db", () => ({ authDb: {} }))
vi.mock("@prood/commerce", () => ({ assertFeature: vi.fn() }))
vi.mock("@prood/platform", () => ({ autoLinkGuestCustomers: mocks.autoLinkGuestCustomers }))
vi.mock("../mailer", () => ({ getMailer: mocks.getMailer }))
vi.mock("../auth/organization-hooks", () => ({ organizationHooks: {} }))
vi.mock("../openapi", () => ({ buildOpenApiDocument: () => ({ paths: {} }) }))
vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory")
  return {
    drizzleAdapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [] }),
  }
})

import { getAuth } from "../auth/server"

const origin = "https://api.prood.test"

function post(path: string, body: unknown) {
  return getAuth().handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    })
  )
}

describe("linking guest orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-long-enough-for-better-auth")
    vi.stubEnv("BETTER_AUTH_URL", origin)
    vi.stubEnv("API_PUBLIC_URL", origin)
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", "https://dashboard.prood.test")
    mocks.getMailer.mockReturnValue({ send: mocks.send })
    mocks.autoLinkGuestCustomers.mockResolvedValue(1)
  })

  it("waits for the user to verify their email", async () => {
    const email = "verified@example.com"

    await post("/sign-up/email", { email, password: "correct-horse", name: "Ana" })
    expect(mocks.autoLinkGuestCustomers).not.toHaveBeenCalled()

    const url = mocks.send.mock.calls[0]?.[1].data.url
    await getAuth().handler(new Request(url))

    expect(mocks.autoLinkGuestCustomers).toHaveBeenCalledExactlyOnceWith(expect.any(String), email)
  })

  it("lets someone sign up and sign in where email isn't configured", async () => {
    const email = "unverified@example.com"
    mocks.getMailer.mockImplementation(() => {
      throw new Error("RESEND_API_KEY is required for email delivery")
    })
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    const signUp = await post("/sign-up/email", { email, password: "correct-horse", name: "Ana" })
    const signIn = await post("/sign-in/email", { email, password: "correct-horse" })

    expect(signUp.status).toBe(200)
    expect(signIn.status).toBe(200)
    expect(mocks.autoLinkGuestCustomers).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
