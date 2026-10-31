import { beforeEach, describe, expect, it, vi } from "vitest"
import type { McpServer } from "@modelcontextprotocol/server"

const mocks = vi.hoisted(() => ({ getMcpCaller: vi.fn() }))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/mcp/context", () => ({ getMcpCaller: mocks.getMcpCaller }))
vi.mock("@prood/commerce", () => ({}))
vi.mock("@/lib/commerce-service", () => {
  const read = new Proxy({}, { get: () => async () => ({ ok: true }) })
  return { admin: read, carts: read, catalog: read, checkout: read, orders: read }
})

import { registerCommerceMcpTools } from "../mcp/tools"

type Tool = (args: Record<string, unknown>) => Promise<unknown>

function tools() {
  const registered = new Map<string, Tool>()
  const server = {
    registerTool: (name: string, _config: unknown, handler: Tool) => registered.set(name, handler),
  }
  registerCommerceMcpTools(server as unknown as McpServer)
  return registered
}

const READ_TOOLS = [
  "adminListProducts",
  "adminGetProduct",
  "adminListOrders",
  "adminGetOrder",
  "adminGetOrderHistory",
  "adminListCustomers",
  "adminGetCustomer",
  "adminGetStore",
  "adminGetDashboard",
]
const args = { id: "id-1" }

describe("MCP admin tools", () => {
  beforeEach(() => {
    mocks.getMcpCaller.mockReturnValue({
      orgId: "org-1",
      scopes: ["staff", "storefront"],
      via: "session",
    })
  })

  it.each(READ_TOOLS)("lets a member use %s, as in REST", async (name) => {
    await expect(tools().get(name)?.(args)).resolves.toBeDefined()
  })

  it("keeps every other admin tool for admins", async () => {
    const writes = [...tools()].filter(
      ([name]) => name.startsWith("admin") && !READ_TOOLS.includes(name)
    )

    expect(writes.length).toBeGreaterThan(0)
    for (const [, tool] of writes) {
      await expect(tool(args)).rejects.toThrow("Insufficient scope")
    }
  })

  it("lets an admin read", async () => {
    mocks.getMcpCaller.mockReturnValue({ orgId: "org-1", scopes: ["admin"], via: "api-key" })

    await expect(tools().get("adminGetDashboard")?.(args)).resolves.toBeDefined()
  })
})
