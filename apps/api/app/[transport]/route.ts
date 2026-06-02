import { handleMcpRequest } from "@/lib/mcp/handler"

const ALLOWED_TRANSPORTS = new Set(["mcp"])

function guardTransport(handler: typeof handleMcpRequest) {
  return (request: Request, ctx: { params: Promise<{ transport: string }> }) =>
    ctx.params.then(({ transport }) => {
      if (!ALLOWED_TRANSPORTS.has(transport)) {
        return Response.json({ error: "Not found" }, { status: 404 })
      }
      return handler(request)
    })
}

/** MCP transport (e.g. `GET|POST /mcp` for streamable HTTP). */
export const GET = guardTransport(handleMcpRequest)
export const POST = guardTransport(handleMcpRequest)
