import { NextResponse, type NextRequest } from "next/server"
import { REQUEST_TARGET_HEADER } from "@/lib/agent-capability"

/** Route handlers can't see their own URL through `headers()`, so pass it on. */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set(REQUEST_TARGET_HEADER, `${request.method} ${request.nextUrl.pathname}`)
  return NextResponse.next({ request: { headers } })
}

export const config = { matcher: "/v1/:path*" }
