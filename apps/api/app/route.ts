import { NextResponse } from "next/server"
import { getCommerceConfig } from "@prood/commerce"
import { errorResponse } from "@/lib/api"

// API index — advertises the contract entry points and the active engine
// (no secrets). Wrapped so a misconfigured commerce import fails as a clean
// JSON error instead of a 500 HTML page.
export async function GET() {
  try {
    const config = getCommerceConfig()
    return NextResponse.json({
      name: "Prood Commerce API",
      version: "v1",
      adapter: config.adapter,
      currency: config.currency,
      openapi: "/v1/openapi.json",
      docs: "/docs/api",
      agentConfiguration: "/.well-known/agent-configuration",
      auth: "/api/auth",
    })
  } catch (err) {
    return errorResponse(err)
  }
}
