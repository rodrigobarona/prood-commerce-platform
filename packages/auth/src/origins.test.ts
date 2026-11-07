import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isTrustedAuthOrigin, resolveTrustedOrigins } from "./origins"

const URL_ENV = [
  "NEXT_PUBLIC_DASHBOARD_URL",
  "NEXT_PUBLIC_ADMIN_URL",
  "NEXT_PUBLIC_WEB_URL",
  "NEXT_PUBLIC_DOCS_URL",
  "NEXT_PUBLIC_AUTH_URL",
  "BETTER_AUTH_URL",
  "VERCEL_URL",
]

// Start from a blank environment, so the shell's own values can't leak in.
beforeEach(() => URL_ENV.forEach((name) => vi.stubEnv(name, "")))
afterEach(() => vi.unstubAllEnvs())

describe("resolveTrustedOrigins", () => {
  it("collapses the apps on the shared domain to one origin, dropping their paths", () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", "https://prood.com")
    vi.stubEnv("NEXT_PUBLIC_ADMIN_URL", "https://prood.com/admin")
    vi.stubEnv("NEXT_PUBLIC_WEB_URL", "https://prood.com")
    vi.stubEnv("NEXT_PUBLIC_DOCS_URL", "https://prood.com/")
    vi.stubEnv("BETTER_AUTH_URL", "https://prood.com")
    expect(resolveTrustedOrigins()).toEqual(["https://prood.com"])
  })

  it("does not trust the API project's internal address", () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", "https://prood.com")
    vi.stubEnv("BETTER_AUTH_URL", "https://prood.com")
    vi.stubEnv("NEXT_PUBLIC_AUTH_URL", "https://api-prood.vercel.app")
    expect(isTrustedAuthOrigin("https://prood.com")).toBe(true)
    expect(isTrustedAuthOrigin("https://api-prood.vercel.app")).toBe(false)
  })

  it("follows the gateway locally", () => {
    vi.stubEnv("NEXT_PUBLIC_DASHBOARD_URL", "http://localhost:3001")
    vi.stubEnv("NEXT_PUBLIC_ADMIN_URL", "http://localhost:3001/admin")
    vi.stubEnv("NEXT_PUBLIC_WEB_URL", "http://localhost:3001")
    vi.stubEnv("BETTER_AUTH_URL", "http://localhost:3001")
    expect(resolveTrustedOrigins()).toEqual(["http://localhost:3001"])
  })
})
