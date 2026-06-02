import "server-only"
import { type NextRequest } from "next/server"

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

/** Origin of apps/api — auth is issued there; dashboard proxies browser traffic. */
export function getAuthUpstreamOrigin(): string {
  const authUrl =
    process.env.AUTH_UPSTREAM_URL?.trim() ??
    process.env.NEXT_PUBLIC_AUTH_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim()

  if (authUrl) {
    try {
      return new URL(authUrl).origin
    } catch {
      /* fall through */
    }
  }

  const commerceApi = process.env.COMMERCE_API_URL?.trim()
  if (commerceApi) {
    try {
      return new URL(commerceApi).origin
    } catch {
      /* fall through */
    }
  }

  return "http://localhost:3005"
}

function shouldKeepCookieDomain(domainValue: string): boolean {
  const shared = process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (!shared) return false

  const normalizedDomain = domainValue.toLowerCase().replace(/^\./, "")
  const normalizedShared = shared.toLowerCase().replace(/^\./, "")
  return (
    normalizedDomain === normalizedShared ||
    domainValue.toLowerCase() === shared.toLowerCase()
  )
}

/** Strip API-only Domain= so session cookies bind to the dashboard host. */
export function rewriteAuthSetCookie(setCookie: string): string {
  return setCookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      if (!part.toLowerCase().startsWith("domain=")) return true
      const domain = part.slice("domain=".length).trim()
      return shouldKeepCookieDomain(domain)
    })
    .join("; ")
}

function buildUpstreamRequestUrl(request: NextRequest): URL {
  const upstream = getAuthUpstreamOrigin()
  return new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, upstream)
}

function buildUpstreamHeaders(request: NextRequest): Headers {
  const headers = new Headers()
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase()
    if (lower === "host" || HOP_BY_HOP_HEADERS.has(lower)) continue
    headers.set(key, value)
  }
  return headers
}

function buildProxyResponse(upstream: Response): Response {
  const headers = new Headers()

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === "set-cookie" || HOP_BY_HOP_HEADERS.has(lower)) return
    headers.append(key, value)
  })

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie")!]
        : []

  for (const cookie of setCookies) {
    headers.append("Set-Cookie", rewriteAuthSetCookie(cookie))
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

/** Forward dashboard /api/auth/* to apps/api and rewrite Set-Cookie for same-origin sessions. */
export async function proxyAuthRequest(request: NextRequest): Promise<Response> {
  const method = request.method.toUpperCase()
  const headers = buildUpstreamHeaders(request)
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer()

  const upstream = await fetch(buildUpstreamRequestUrl(request), {
    method,
    headers,
    body,
    redirect: "manual",
  })

  return buildProxyResponse(upstream)
}
