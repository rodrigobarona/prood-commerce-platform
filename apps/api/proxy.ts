import { NextResponse, type NextRequest } from "next/server"
import { methodsForPath, REQUEST_TARGET_HEADER } from "@/lib/agent-capability"

const PASS_THROUGH = new Set(["HEAD", "OPTIONS"])

/**
 * Route handlers can't see their own URL through `headers()`, so pass it on.
 *
 * No CORS here: the docs playground is served from the same origin as /v1
 * (prood.com/docs), and the stores reach the API from the server.
 */
export function proxy(request: NextRequest) {
  // Next answers a wrong method with an empty 405, so the API's shape goes on here.
  const allowed = methodsForPath(request.nextUrl.pathname)
  if (allowed.length > 0 && !allowed.includes(request.method) && !PASS_THROUGH.has(request.method)) {
    return NextResponse.json(
      {
        code: "METHOD_NOT_ALLOWED",
        message: `This route doesn't take ${request.method}. It takes ${allowed.join(" and ")}.`,
      },
      { status: 405, headers: { Allow: allowed.join(", ") } }
    )
  }

  const headers = new Headers(request.headers)
  headers.set(REQUEST_TARGET_HEADER, `${request.method} ${request.nextUrl.pathname}`)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: "/v1/:path*" }
