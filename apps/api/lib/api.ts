import { NextResponse } from "next/server"
import { CommerceError, toErrorResponse } from "@prood/types"

/** Without this, a path with no route gets Next's HTML page instead of the API's error shape. */
export function routeNotFound(): NextResponse {
  return NextResponse.json(
    { code: "NOT_FOUND", message: "There's no API route here. The routes are listed at /v1/openapi.json." },
    { status: 404 }
  )
}

/** Build a JSON error response from any thrown error (Commerce/Zod/unknown). */
export function errorResponse(err: unknown): NextResponse {
  const { status, body } = toErrorResponse(err)
  const isPrerenderError =
    err instanceof Error && "digest" in err && typeof (err as { digest: unknown }).digest === "string"
  if (status >= 500 && !isPrerenderError) {
    console.error("[api]", err)
  }
  if (
    process.env.NODE_ENV === "development" &&
    status === 500 &&
    body.code === "UNKNOWN" &&
    err instanceof Error
  ) {
    body.message = err.message
  }
  return NextResponse.json(body, { status, headers: retryHeaders(err) })
}

/** A refusal that's only for now says when to come back. */
export function retryHeaders(err: unknown): HeadersInit | undefined {
  return err instanceof CommerceError && err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined
}
