import "server-only"
import { requiredEnv } from "@prood/types"
import { forwardClientIp } from "./client-ip"

// The admin console has no auth handler of its own: its same-origin /admin/api/auth/* route forwards
// to apps/api (the issuer) and rewrites Set-Cookie so sessions bind to the calling host. The
// dashboard needs none: /api/auth/* on prood.com already goes to apps/api through the gateway.

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
])

/** Response headers invalidated when fetch() auto-decompresses the upstream body. */
const STRIP_RESPONSE_HEADERS = new Set(["set-cookie", "content-encoding", "content-length"])

function authUpstreamOrigin(): string {
  return new URL(requiredEnv(process.env.NEXT_PUBLIC_AUTH_URL, "NEXT_PUBLIC_AUTH_URL")).origin
}

/**
 * Keep `Domain=` only when it is the shared AUTH_COOKIE_DOMAIN and the calling
 * host is inside it; otherwise the cookie becomes host-only for the caller.
 */
function rewriteSetCookie(setCookie: string, requestHost: string | undefined): string {
  const shared = process.env.AUTH_COOKIE_DOMAIN?.trim().toLowerCase().replace(/^\./, "")
  const host = requestHost?.split(":")[0]?.toLowerCase()
  const keepShared = !!shared && !!host && (host === shared || host.endsWith(`.${shared}`))

  return setCookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      if (!part.toLowerCase().startsWith("domain=")) return true
      const domain = part.slice("domain=".length).trim().toLowerCase().replace(/^\./, "")
      return keepShared && domain === shared
    })
    .join("; ")
}

function upstreamHeaders(request: Request): Headers {
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase()
    if (lower === "host" || lower === "accept-encoding" || HOP_BY_HOP_HEADERS.has(lower)) continue
    headers.set(key, value)
  }
  forwardClientIp(request.headers, headers)
  return headers
}

/**
 * Forward an /api/auth/* request to apps/api and return its response. Under a base path
 * (/admin/api/auth/*) Next.js hands route handlers the path without it, so `request.url`
 * already reads /api/auth/*, which is what the issuer serves.
 */
export async function proxyAuthRequest(request: Request): Promise<Response> {
  const method = request.method.toUpperCase()
  const url = new URL(request.url)
  const upstream = await fetch(new URL(`${url.pathname}${url.search}`, authUpstreamOrigin()), {
    method,
    headers: upstreamHeaders(request),
    body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  })

  const headers = new Headers()
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (STRIP_RESPONSE_HEADERS.has(lower) || HOP_BY_HOP_HEADERS.has(lower)) return
    headers.append(key, value)
  })
  const requestHost = request.headers.get("host") ?? undefined
  for (const cookie of upstream.headers.getSetCookie()) {
    headers.append("Set-Cookie", rewriteSetCookie(cookie, requestHost))
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}
