import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { proxyAdminAuthRequest, proxyAuthRequest } from "./proxy"

const upstream = vi.fn()

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_URL", "https://api.prood.test")
  vi.stubGlobal("fetch", upstream)
  upstream.mockResolvedValue(
    new Response("{}", {
      headers: [
        ["set-cookie", "__Secure-better-auth.session_token=abc; Path=/; HttpOnly"],
        ["set-cookie", "__Secure-better-auth.trust_device=zzz!yyy; Path=/; Max-Age=2592000"],
      ],
    })
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const request = () =>
  new Request("https://admin.prood.test/api/auth/two-factor/verify-totp", {
    method: "POST",
    headers: { cookie: "a=1; __Secure-better-auth.trust_device=zzz!yyy; b=2", "content-type": "application/json" },
    body: "{}",
  })

describe("the dashboard's auth proxy", () => {
  it("passes a trusted-device cookie through, both ways", async () => {
    const res = await proxyAuthRequest(request())
    expect((upstream.mock.calls[0]![1] as { headers: Headers }).headers.get("cookie")).toContain("trust_device")
    expect(res.headers.getSetCookie().some((cookie) => cookie.includes("trust_device"))).toBe(true)
  })
})

describe("the admin's auth proxy", () => {
  it("never sends a trusted-device cookie upstream, so the second step is always asked for", async () => {
    await proxyAdminAuthRequest(request())
    const sent = (upstream.mock.calls[0]![1] as { headers: Headers }).headers.get("cookie")
    expect(sent).not.toContain("trust_device")
    expect(sent).toContain("a=1")
    expect(sent).toContain("b=2")
  })

  it("never lets a trusted-device cookie reach the browser, but keeps the session", async () => {
    const res = await proxyAdminAuthRequest(request())
    const cookies = res.headers.getSetCookie()
    expect(cookies.some((cookie) => cookie.includes("trust_device"))).toBe(false)
    expect(cookies.some((cookie) => cookie.includes("session_token"))).toBe(true)
  })
})
