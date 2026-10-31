// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  autoLinkGuestCustomers: vi.fn(),
  send: vi.fn(),
}))

vi.mock("next/server", () => ({ after: (task: () => Promise<void>) => task() }))
vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }))
vi.mock("@prood/platform", () => ({
  autoLinkGuestCustomers: mocks.autoLinkGuestCustomers,
  getStorefrontIdentity: async () => ({ name: "Store", origin: "https://store.test" }),
  lookupTenantByHost: async () => "org-1",
}))
vi.mock("../tenant", () => ({ resolveTenantId: async () => "org-1" }))
vi.mock("../auth/db", () => ({ authDb: {} }))
vi.mock("../mailer", () => ({ getMailer: () => ({ send: mocks.send }) }))
vi.mock("better-auth/adapters/drizzle", async () => {
  const { memoryAdapter } = await import("better-auth/adapters/memory")
  return {
    drizzleAdapter: () => memoryAdapter({ user: [], session: [], account: [], verification: [] }),
  }
})

import { getAuth } from "../auth/server"

const origin = "https://store.test"

function post(path: string, body: unknown) {
  return getAuth().handler(
    new Request(`${origin}/api/auth${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify(body),
    })
  )
}

function verificationUrl(): string {
  const call = mocks.send.mock.calls.find(([, email]) => email.template === "activation")
  return call?.[1].data.url
}

describe("linking guest orders", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv("BETTER_AUTH_SECRET", "test-secret-that-is-long-enough-for-better-auth")
    vi.stubEnv("NEXT_PUBLIC_STOREFRONT_URL", origin)
    vi.stubEnv("NEXT_PUBLIC_PLATFORM_DOMAIN", "store.test")
    mocks.send.mockResolvedValue(undefined)
    mocks.autoLinkGuestCustomers.mockResolvedValue(1)
  })

  it("waits for the shopper to verify their email", async () => {
    const email = "verified@example.com"
    const user = { email, password: "correct-horse", name: "Ana" }

    expect((await post("/sign-up/email", user)).status).toBe(200)
    expect(mocks.autoLinkGuestCustomers).not.toHaveBeenCalled()

    const verified = await getAuth().handler(new Request(verificationUrl()))

    expect(verified.status).toBeLessThan(400)
    expect(mocks.autoLinkGuestCustomers).toHaveBeenCalledExactlyOnceWith(expect.any(String), email)
  })

  it("lets a shopper sign in without verifying, and links nothing", async () => {
    const email = "unverified@example.com"
    const user = { email, password: "correct-horse", name: "Ana" }
    mocks.send.mockRejectedValue(new Error("Resend isn't configured"))
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect((await post("/sign-up/email", user)).status).toBe(200)
    const signIn = await post("/sign-in/email", { email, password: user.password })

    expect(signIn.status).toBe(200)
    expect(mocks.autoLinkGuestCustomers).not.toHaveBeenCalled()
    consoleError.mockRestore()
  })
})
