import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ enabled: vi.fn() }))
vi.mock("@prood/auth/two-factor", () => ({ isTwoFactorEnabledForEmail: mocks.enabled }))

import { refuseTwoFactorPasswordSignIn } from "../auth/two-factor-guard"

beforeEach(() => vi.clearAllMocks())

describe("password sign-in on a store", () => {
  it("is refused for an account that has two-factor on, so a store can't get around the dashboard's second step", async () => {
    mocks.enabled.mockResolvedValue(true)
    await expect(
      refuseTwoFactorPasswordSignIn({ path: "/sign-in/email", body: { email: "Owner@Example.com", password: "x" } })
    ).rejects.toThrow("Sign in from the Prood dashboard")
    expect(mocks.enabled).toHaveBeenCalledWith("Owner@Example.com")
  })

  it("is untouched for everyone else", async () => {
    mocks.enabled.mockResolvedValue(false)
    await expect(
      refuseTwoFactorPasswordSignIn({ path: "/sign-in/email", body: { email: "shopper@example.com", password: "x" } })
    ).resolves.toBeUndefined()
  })

  it("only looks at password sign-in", async () => {
    await refuseTwoFactorPasswordSignIn({ path: "/sign-up/email", body: { email: "a@b.c" } })
    await refuseTwoFactorPasswordSignIn({ path: "/sign-in/email", body: {} })
    expect(mocks.enabled).not.toHaveBeenCalled()
  })
})
