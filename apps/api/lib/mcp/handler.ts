import { createMcpHandler } from "mcp-handler"
import { CommerceError, toErrorResponse } from "@prood/types"
import { resolveCallerFromHeaders } from "@/lib/resolve-caller"
import { mcpCallerStorage } from "@/lib/mcp/context"
import { registerCommerceMcpTools } from "@/lib/mcp/tools"

const mcpHandler = createMcpHandler(
  (server) => {
    registerCommerceMcpTools(server)
  },
  {
    serverInfo: {
      name: "prood-commerce",
      version: "1.0.0",
    },
  },
  {
    basePath: "",
    maxDuration: 60,
    verboseLogs: process.env.NODE_ENV === "development",
  }
)

/** Authenticated MCP entry — requires API key, session, host, or agent JWT. */
export async function handleMcpRequest(request: Request): Promise<Response> {
  try {
    const caller = await resolveCallerFromHeaders(request.headers)
    if (!caller) {
      const { status, body } = toErrorResponse(
        new CommerceError("Authentication required", "UNAUTHORIZED")
      )
      return Response.json(
        { ...body, message: "Authentication required (x-api-key, session, host, or agent JWT)" },
        { status }
      )
    }
    return mcpCallerStorage.run(caller, () => mcpHandler(request))
  } catch (err) {
    if (err instanceof CommerceError) {
      const { status, body } = toErrorResponse(err)
      return Response.json(body, { status })
    }
    throw err
  }
}
