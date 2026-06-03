import { NextResponse } from "next/server"
import { toErrorResponse } from "@prood/types"

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
  return NextResponse.json(body, { status })
}
