import { handleMcpRequest } from "@/lib/mcp/handler"

/** MCP Streamable HTTP endpoint (`POST /mcp`; `GET` answers 405 — serving is stateless). */
export const GET = handleMcpRequest
export const POST = handleMcpRequest
