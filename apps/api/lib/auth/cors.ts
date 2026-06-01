import { isTrustedAuthOrigin } from "@prood/auth/origins"

/** Attach CORS headers for dashboard (and other trusted) browser clients. */
export function applyAuthCors(request: Request, response: Response): Response {
  const origin = request.headers.get("Origin")
  if (!isTrustedAuthOrigin(origin)) return response

  const headers = new Headers(response.headers)
  headers.set("Access-Control-Allow-Origin", origin)
  headers.set("Access-Control-Allow-Credentials", "true")
  headers.append("Vary", "Origin")
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/** Preflight for cross-origin auth requests (Next.js default OPTIONS lacks CORS). */
export function authPreflightResponse(request: Request): Response {
  const headers = new Headers()
  const origin = request.headers.get("Origin")

  if (isTrustedAuthOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin)
    headers.set("Access-Control-Allow-Credentials", "true")
    headers.append("Vary", "Origin")
  }

  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Better-Auth-Client"
  )
  headers.set("Access-Control-Max-Age", "86400")

  return new Response(null, { status: 204, headers })
}
