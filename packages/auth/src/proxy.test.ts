import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

import { proxyAuthRequest } from "./proxy"

const upstream = vi.fn()

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_AUTH_URL", "https://api.prood.test")
  vi.stubGlobal("fetch", upstream)
  upstream.mockResolvedValue(
    new Response("{}", {
      headers: [
        ["set-cookie", "__Secure-better-auth.session_token=abc; Path=/; HttpOnly; Domain=api.prood.test"],
      ],
    })
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const request = (url: string) =>
  new Request(url, {
    method: "POST",
    headers: { cookie: "a=1; b=2", host: "prood.com", "content-type": "application/json", origin: "https://prood.com" },
    body: "{}",
  })

// Under a base path, Next.js gives route handlers a request whose URL has the base path taken off:
// /dashboard/api/auth/* arrives as /api/auth/*. The issuer serves /api/auth/*, so the path goes as it is.
describe("the auth proxy", () => {
  it("forwards the path and the query to the issuer's own origin", async () => {
    await proxyAuthRequest(request("https://prood.com/api/auth/two-factor/verify-totp?x=1"))
    expect((upstream.mock.calls[0]![0] as URL).href).toBe("https://api.prood.test/api/auth/two-factor/verify-totp?x=1")
  })

  it("passes the caller's origin and cookies on, not its host", async () => {
    await proxyAuthRequest(request("https://prood.com/api/auth/sign-in/email"))
    const sent = (upstream.mock.calls[0]![1] as { headers: Headers }).headers
    expect(sent.get("origin")).toBe("https://prood.com")
    expect(sent.get("cookie")).toBe("a=1; b=2")
    expect(sent.has("host")).toBe(false)
  })

  it("makes the session cookie host-only on the calling host, for the whole site", async () => {
    const res = await proxyAuthRequest(request("https://prood.com/api/auth/sign-in/email"))
    const [cookie] = res.headers.getSetCookie()
    expect(cookie).toContain("session_token=abc")
    expect(cookie).toContain("Path=/")
    expect(cookie).not.toMatch(/domain=/i)
  })

  it("keeps the shared cookie domain when the calling host is inside it", async () => {
    vi.stubEnv("AUTH_COOKIE_DOMAIN", "prood.com")
    upstream.mockResolvedValue(new Response("{}", { headers: [["set-cookie", "s=1; Path=/; Domain=prood.com"]] }))
    const res = await proxyAuthRequest(request("https://prood.com/api/auth/sign-in/email"))
    expect(res.headers.getSetCookie()[0]).toMatch(/domain=prood\.com/i)
  })
})
