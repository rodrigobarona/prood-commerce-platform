import { createMcpHandler } from "mcp-handler"
import { CommerceError } from "@prood/commerce"
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
      return Response.json(
        { error: "Authentication required (x-api-key, session, or host)" },
        { status: 401 }
      )
    }
    return mcpCallerStorage.run(caller, () => mcpHandler(request))
  } catch (err) {
    if (err instanceof CommerceError) {
      const status = err.code === "UNAUTHORIZED" ? 401 : err.code === "FORBIDDEN" ? 403 : 400
      return Response.json({ error: err.message, code: err.code }, { status })
    }
    throw err
  }
}
