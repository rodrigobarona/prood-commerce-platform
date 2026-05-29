import { handleMcpRequest } from "@/lib/mcp/handler"

/** MCP transport (e.g. `GET|POST /mcp` for streamable HTTP). */
export const GET = handleMcpRequest
export const POST = handleMcpRequest
