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

const STRIP_RESPONSE_HEADERS = new Set([
  "set-cookie",
  "content-encoding",
  "content-length",
])

export function getAuthUpstreamOrigin(): string {
  const authUrl =
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

function shouldKeepCookieDomain(
  domainValue: string,
  requestHost?: string
): boolean {
  if (requestHost?.endsWith(".vercel.app")) return false

  const shared = process.env.AUTH_COOKIE_DOMAIN?.trim()
  if (!shared) return false

  const normalizedDomain = domainValue.toLowerCase().replace(/^\./, "")
  const normalizedShared = shared.toLowerCase().replace(/^\./, "")
  return (
    normalizedDomain === normalizedShared ||
    domainValue.toLowerCase() === shared.toLowerCase()
  )
}

export function rewriteAuthSetCookie(
  setCookie: string,
  requestHost?: string
): string {
  return setCookie
    .split(";")
    .map((part) => part.trim())
    .filter((part) => {
      if (!part.toLowerCase().startsWith("domain=")) return true
      const domain = part.slice("domain=".length).trim()
      return shouldKeepCookieDomain(domain, requestHost)
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
    if (
      lower === "host" ||
      lower === "accept-encoding" ||
      HOP_BY_HOP_HEADERS.has(lower)
    ) {
      continue
    }
    headers.set(key, value)
  }
  return headers
}

function buildProxyResponse(
  upstream: Response,
  requestHost?: string
): Response {
  const headers = new Headers()

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (STRIP_RESPONSE_HEADERS.has(lower) || HOP_BY_HOP_HEADERS.has(lower)) return
    headers.append(key, value)
  })

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : upstream.headers.get("set-cookie")
        ? [upstream.headers.get("set-cookie")!]
        : []

  const cookieNames: string[] = []
  for (const cookie of setCookies) {
    headers.append("Set-Cookie", rewriteAuthSetCookie(cookie, requestHost))
    const name = cookie.split("=")[0]
    if (name) cookieNames.push(name)
  }

  if (setCookies.length > 0) {
    console.log(
      `[auth-proxy] ${upstream.status} — forwarding ${setCookies.length} Set-Cookie(s): [${cookieNames.join(", ")}]`
    )
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

/** Forward admin /api/auth/* to apps/api and rewrite Set-Cookie for same-origin sessions. */
export async function proxyAuthRequest(request: NextRequest): Promise<Response> {
  const method = request.method.toUpperCase()
  const upstreamUrl = buildUpstreamRequestUrl(request)
  const headers = buildUpstreamHeaders(request)
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer()

  console.log(`[auth-proxy] ${method} ${upstreamUrl.pathname}`)

  const upstream = await fetch(upstreamUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  })

  return buildProxyResponse(upstream, request.headers.get("host") ?? undefined)
}
