import { NextResponse, type NextRequest } from "next/server"
import { methodsForPath, REQUEST_TARGET_HEADER } from "@/lib/agent-capability"

const PASS_THROUGH = new Set(["HEAD", "OPTIONS"])

/**
 * The docs' API playground calls /v1 from the browser, with a key the reader
 * typed. It's the only origin that gets this, and never with credentials, so a
 * signed-in merchant's cookie doesn't count from there.
 */
function docsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("Origin")
  const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL
  return origin && docsUrl && origin === new URL(docsUrl).origin ? origin : null
}

function allowDocs<Response extends NextResponse>(response: Response, origin: string | null): Response {
  response.headers.append("Vary", "Origin")
  if (origin) response.headers.set("Access-Control-Allow-Origin", origin)
  return response
}

/** Route handlers can't see their own URL through `headers()`, so pass it on. */
export function proxy(request: NextRequest) {
  const origin = docsOrigin(request)
  if (origin && request.method === "OPTIONS") {
    return allowDocs(
      new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE",
          "Access-Control-Allow-Headers": "Authorization, Content-Type, x-api-key, x-storefront-host",
          "Access-Control-Max-Age": "86400",
        },
      }),
      origin
    )
  }

  // Next answers a wrong method with an empty 405, so the API's shape goes on here.
  const allowed = methodsForPath(request.nextUrl.pathname)
  if (allowed.length > 0 && !allowed.includes(request.method) && !PASS_THROUGH.has(request.method)) {
    return allowDocs(
      NextResponse.json(
        {
          code: "METHOD_NOT_ALLOWED",
          message: `This route doesn't take ${request.method}. It takes ${allowed.join(" and ")}.`,
        },
        { status: 405, headers: { Allow: allowed.join(", ") } }
      ),
      origin
    )
  }

  const headers = new Headers(request.headers)
  headers.set(REQUEST_TARGET_HEADER, `${request.method} ${request.nextUrl.pathname}`)
  return allowDocs(NextResponse.next({ request: { headers } }), origin)
}

export const config = { matcher: "/v1/:path*" }
