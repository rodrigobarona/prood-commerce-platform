import { createHash } from "node:crypto"
import { isIP } from "node:net"
import { safeEqual } from "@prood/types"

// Dashboard and admin reach apps/api through their own /api/auth proxy, so the
// API only ever sees the proxy's address. Rate limits keyed on that would put
// every merchant in one bucket, and one attacker could lock them all out. The
// proxy passes the client's address along, vouched for by a shared secret.

/** The address a request is rate limited on. Only `withTrustedClientIp` may set it for Better Auth. */
export const CLIENT_IP_HEADER = "x-prood-client-ip"
export const PROXY_SECRET_HEADER = "x-prood-proxy-secret"

/** Vercel overwrites both of these, so what's in them is the real caller. */
function platformClientIp(headers: Headers): string | null {
  const ip = headers.get("x-real-ip")?.trim() || headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return ip && isIP(ip) ? ip : null
}

/**
 * Stands in when no address can be found, so nobody falls into one shared
 * bucket: an address in the private IPv6 range, in a /64 of its own for each
 * browser fingerprint. Better Auth keys IPv6 on the /64.
 */
function fingerprintIp(headers: Headers): string {
  const source = `${headers.get("user-agent") ?? ""}\n${headers.get("accept-language") ?? ""}`
  const hash = createHash("sha256").update(source).digest("hex")
  return `fd${hash.slice(0, 2)}:${hash.slice(2, 6)}:${hash.slice(6, 10)}:${hash.slice(10, 14)}::1`
}

/** For the proxy: drop whatever the caller claimed, and pass on the address the platform saw. */
export function forwardClientIp(incoming: Headers, outgoing: Headers): void {
  outgoing.delete(CLIENT_IP_HEADER)
  outgoing.delete(PROXY_SECRET_HEADER)

  const secret = configuredSecret()
  if (!secret) return
  outgoing.set(PROXY_SECRET_HEADER, secret)
  const ip = platformClientIp(incoming)
  if (ip) outgoing.set(CLIENT_IP_HEADER, ip)
}

/** Required in production on both sides: without it every merchant shares one bucket again. */
function configuredSecret(): string | undefined {
  const secret = process.env.AUTH_PROXY_SECRET?.trim()
  if (!secret && process.env.NODE_ENV === "production") throw new Error("AUTH_PROXY_SECRET is required")
  return secret
}

/** The proxy's secret, compared in constant time. Without a configured secret nobody is the proxy. */
function fromTrustedProxy(headers: Headers): boolean {
  const expected = configuredSecret()
  const provided = headers.get(PROXY_SECRET_HEADER)?.trim()
  if (!provided) return false
  const trusted = Boolean(expected) && safeEqual(provided, expected ?? "")
  // Either a misconfigured deployment or someone guessing. Never log the value.
  if (!trusted) console.error("[auth] a request carried a proxy secret that doesn't match")
  return trusted
}

/**
 * For the auth issuer: a copy of the request whose `CLIENT_IP_HEADER` can be
 * believed. The caller's own value only survives with the proxy's secret, and
 * the secret itself goes no further. For the proxy, the platform's address is
 * the proxy's own, so a request with none falls to the fingerprint instead.
 */
export function withTrustedClientIp(request: Request): Request {
  const headers = new Headers(request.headers)
  const forwarded = request.headers.get(CLIENT_IP_HEADER)?.trim()
  const clientIp = fromTrustedProxy(request.headers)
    ? forwarded && isIP(forwarded)
      ? forwarded
      : null
    : platformClientIp(request.headers)
  headers.delete(PROXY_SECRET_HEADER)
  headers.set(CLIENT_IP_HEADER, clientIp ?? fingerprintIp(request.headers))
  // Built from its parts: Next.js hands over its own Request class, and `new Request(request)` can't read that.
  const hasBody = request.method !== "GET" && request.method !== "HEAD"
  return new Request(request.url, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    signal: request.signal,
    ...(hasBody ? { duplex: "half" } : {}),
  } as RequestInit)
}
