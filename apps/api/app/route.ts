import { NextResponse } from "next/server"
import { requiredEnv } from "@prood/types"

// API index — advertises the contract entry points and the active engine
// (no secrets).
export function GET() {
  return NextResponse.json({
    name: "Prood Commerce API",
    version: "v1",
    adapter: "platform",
    openapi: "/v1/openapi.json",
    docs: `${requiredEnv(process.env.NEXT_PUBLIC_DOCS_URL, "NEXT_PUBLIC_DOCS_URL").replace(/\/$/, "")}/docs/api`,
    agentConfiguration: "/.well-known/agent-configuration",
    auth: "/api/auth",
    mcp: "/mcp",
  })
}
