import { NextResponse } from "next/server"
import { toErrorResponse } from "@workspace/commerce"

export function errorResponse(err: unknown): NextResponse {
  const { status, body } = toErrorResponse(err)
  return NextResponse.json(body, { status })
}

export function requireApiSecret(request: Request): void {
  const secret = process.env.CHECKOUT_API_SECRET
  if (!secret) return
  const header = request.headers.get("x-checkout-secret")
  if (header !== secret) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 })
  }
}
