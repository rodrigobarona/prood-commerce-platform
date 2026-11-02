import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isIP } from "node:net"
import { NextRequest } from "next/server"
import {
  CLIENT_IP_HEADER,
  PROXY_SECRET_HEADER,
  forwardClientIp,
  withTrustedClientIp,
} from "@prood/auth/client-ip"

const SECRET = "shared-secret"
const url = "https://api.test/api/auth/sign-in/email"
const trusted = (headers: Record<string, string>) =>
  withTrustedClientIp(new Request(url, { headers })).headers.get(CLIENT_IP_HEADER)

beforeEach(() => {
  vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("forwardClientIp, in the proxy", () => {
  it("signs the address the platform saw", () => {
    const outgoing = new Headers()
    forwardClientIp(new Headers({ "x-real-ip": "203.0.113.7" }), outgoing)

    expect(outgoing.get(CLIENT_IP_HEADER)).toBe("203.0.113.7")
    expect(outgoing.get(PROXY_SECRET_HEADER)).toBe(SECRET)
  })

  it("throws away what the caller claimed", () => {
    const spoofed = { [CLIENT_IP_HEADER]: "1.2.3.4", [PROXY_SECRET_HEADER]: "guess" }
    const outgoing = new Headers(spoofed)
    forwardClientIp(new Headers({ ...spoofed, "x-real-ip": "203.0.113.7" }), outgoing)

    expect(outgoing.get(CLIENT_IP_HEADER)).toBe("203.0.113.7")
    expect(outgoing.get(PROXY_SECRET_HEADER)).toBe(SECRET)
  })

  it("claims nothing when the platform gave no address", () => {
    const outgoing = new Headers({ [CLIENT_IP_HEADER]: "1.2.3.4" })
    forwardClientIp(new Headers({ [CLIENT_IP_HEADER]: "1.2.3.4" }), outgoing)

    expect(outgoing.has(CLIENT_IP_HEADER)).toBe(false)
  })

  it("refuses to run in production without the secret", () => {
    vi.stubEnv("AUTH_PROXY_SECRET", "")
    vi.stubEnv("NODE_ENV", "production")

    expect(() => forwardClientIp(new Headers(), new Headers())).toThrow("AUTH_PROXY_SECRET")
  })
})

describe("withTrustedClientIp, at the issuer", () => {
  it("believes the proxy, and keeps its secret from going further", () => {
    const request = withTrustedClientIp(
      new Request(url, {
        headers: { [CLIENT_IP_HEADER]: "203.0.113.7", [PROXY_SECRET_HEADER]: SECRET, "x-real-ip": "76.76.21.1" },
      })
    )

    expect(request.headers.get(CLIENT_IP_HEADER)).toBe("203.0.113.7")
    expect(request.headers.has(PROXY_SECRET_HEADER)).toBe(false)
  })

  it.each([
    ["no secret", {}],
    ["a wrong secret", { [PROXY_SECRET_HEADER]: "guess" }],
  ])("ignores a spoofed address sent with %s", (_, secret) => {
    vi.spyOn(console, "error").mockImplementationOnce(() => {})
    expect(trusted({ [CLIENT_IP_HEADER]: "1.2.3.4", "x-real-ip": "198.51.100.9", ...secret })).toBe("198.51.100.9")
  })

  it("trusts nobody when the secret isn't configured", () => {
    vi.stubEnv("AUTH_PROXY_SECRET", "")
    vi.spyOn(console, "error").mockImplementationOnce(() => {})

    expect(trusted({ [CLIENT_IP_HEADER]: "1.2.3.4", [PROXY_SECRET_HEADER]: "guess", "x-real-ip": "198.51.100.9" })).toBe(
      "198.51.100.9"
    )
  })

  it("doesn't take the proxy's own address for a client's", () => {
    const proxied = { [PROXY_SECRET_HEADER]: SECRET, "x-real-ip": "76.76.21.1", "user-agent": "Safari" }

    expect(trusted({ ...proxied, [CLIENT_IP_HEADER]: "1.2.3.4, 5.6.7.8" })).not.toBe("76.76.21.1")
    expect(isIP(trusted(proxied) ?? "")).toBe(6)
  })

  it("moves on from an empty x-real-ip", () => {
    expect(trusted({ "x-real-ip": "", "x-forwarded-for": "198.51.100.9" })).toBe("198.51.100.9")
  })

  it("logs a secret that doesn't match, without the value", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {})

    trusted({ [PROXY_SECRET_HEADER]: "guess-this", "x-real-ip": "198.51.100.9" })

    expect(logged).toHaveBeenCalledOnce()
    expect(JSON.stringify(logged.mock.calls)).not.toContain("guess-this")
    logged.mockRestore()
  })

  it("refuses to run in production without the secret", () => {
    vi.stubEnv("AUTH_PROXY_SECRET", "")
    vi.stubEnv("NODE_ENV", "production")

    expect(() => trusted({ "x-real-ip": "198.51.100.9" })).toThrow("AUTH_PROXY_SECRET")
  })

  it("doesn't put clients with no address in one bucket", () => {
    const first = trusted({ [PROXY_SECRET_HEADER]: SECRET, "user-agent": "Safari" }) ?? ""
    const second = trusted({ [PROXY_SECRET_HEADER]: SECRET, "user-agent": "Firefox" }) ?? ""

    expect(isIP(first)).toBe(6)
    // Better Auth keys IPv6 on the /64, so the difference has to be in the first half.
    expect(first.split(":").slice(0, 4)).not.toEqual(second.split(":").slice(0, 4))
  })

  // Route handlers get Next's class, not the global one. Only a real POST through it shows the difference.
  it("keeps the method and body of the NextRequest a route handler gets", async () => {
    const request = withTrustedClientIp(
      new NextRequest(url, { method: "POST", body: '{"email":"ana@loja.pt"}', headers: { "x-real-ip": "198.51.100.9" } })
    )

    expect(request.method).toBe("POST")
    await expect(request.json()).resolves.toEqual({ email: "ana@loja.pt" })
    expect(request.headers.get(CLIENT_IP_HEADER)).toBe("198.51.100.9")
  })

  it("leaves a GET without a body", () => {
    const request = withTrustedClientIp(new NextRequest(url))

    expect(request.method).toBe("GET")
    expect(request.body).toBeNull()
  })

  it("keeps the same bucket for the same client", () => {
    const client = { "user-agent": "Safari", "accept-language": "pt-PT" }

    expect(trusted(client)).toBe(trusted(client))
  })
})
