import { NextResponse } from "next/server"
import { CommerceError, safeEqual, toErrorResponse } from "@prood/types"

export function errorResponse(err: unknown): NextResponse {
  const { status, body } = toErrorResponse(err)
  return NextResponse.json(body, { status })
}

/** Authenticate server-to-server calls from the storefront and API. */
export function requireApiSecret(request: Request): void {
  const expected = process.env.CHECKOUT_API_SECRET?.trim()
  const provided = request.headers.get("x-checkout-secret")?.trim()
  if (!expected || !provided || !safeEqual(provided, expected)) {
    throw new CommerceError("Invalid checkout secret", "UNAUTHORIZED", 401)
  }
}
