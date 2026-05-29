import { NextResponse } from "next/server"
import { toErrorResponse } from "@workspace/commerce"

/** Build a JSON error response from any thrown error (Commerce/Zod/unknown). */
export function errorResponse(err: unknown): NextResponse {
  const { status, body } = toErrorResponse(err)
  return NextResponse.json(body, { status })
}
