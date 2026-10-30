import { NextResponse } from "next/server"

// API index — advertises the contract entry points and the active engine
// (no secrets).
export function GET() {
  return NextResponse.json({
    name: "Prood Commerce API",
    version: "v1",
    adapter: "platform",
    openapi: "/v1/openapi.json",
    docs: "/docs/api",
    agentConfiguration: "/.well-known/agent-configuration",
    auth: "/api/auth",
    mcp: "/mcp",
  })
}
