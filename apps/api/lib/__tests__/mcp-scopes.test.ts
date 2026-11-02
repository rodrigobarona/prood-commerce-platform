import { beforeEach, describe, expect, it, vi } from "vitest"
import type { McpServer } from "@modelcontextprotocol/server"

const mocks = vi.hoisted(() => ({
  assertCanCreateProduct: vi.fn(),
  assertCanPlaceOrder: vi.fn(),
  createProduct: vi.fn(),
  getMcpCaller: vi.fn(),
  placeOrder: vi.fn(),
}))

vi.mock("server-only", () => ({}))
vi.mock("@/lib/mcp/context", () => ({ getMcpCaller: mocks.getMcpCaller }))
vi.mock("@prood/commerce", () => ({}))
vi.mock("@/lib/enforcement", () => ({
  assertCanCreateProduct: mocks.assertCanCreateProduct,
  assertCanPlaceOrder: mocks.assertCanPlaceOrder,
}))
vi.mock("@/lib/commerce-service", () => {
  const read = (overrides = {}) =>
    new Proxy(overrides, {
      get: (target, key) => Reflect.get(target, key) ?? (async () => ({ ok: true })),
    })
  return {
    admin: read({ createProduct: mocks.createProduct }),
    carts: read(),
    catalog: read(),
    checkout: read({ placeOrder: mocks.placeOrder }),
    orders: read(),
  }
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
      await expect(tool(args)).rejects.toThrow("Only store owners and admins")
    }
  })

  it("lets an admin read", async () => {
    mocks.getMcpCaller.mockReturnValue({ orgId: "org-1", scopes: ["admin"], via: "api-key" })

    await expect(tools().get("adminGetDashboard")?.(args)).resolves.toBeDefined()
  })
})

describe("MCP plan limits, as in REST", () => {
  const placeOrder = { cartId: "cart-1", email: "ana@example.pt" }
  const limitReached = new Error("limit reached")

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.assertCanCreateProduct.mockResolvedValue(undefined)
    mocks.assertCanPlaceOrder.mockResolvedValue(undefined)
    mocks.placeOrder.mockResolvedValue({ id: "order-1" })
    mocks.createProduct.mockResolvedValue({ id: "product-1" })
  })

  it("refuses an order past the month's limit before anything is created", async () => {
    mocks.getMcpCaller.mockReturnValue({ orgId: "org-1", scopes: ["storefront"], via: "api-key" })
    mocks.assertCanPlaceOrder.mockRejectedValue(limitReached)

    await expect(tools().get("placeOrder")?.(placeOrder)).rejects.toThrow(limitReached)
    expect(mocks.assertCanPlaceOrder).toHaveBeenCalledWith("org-1")
    expect(mocks.placeOrder).not.toHaveBeenCalled()
  })

  it("refuses a product past the plan's limit", async () => {
    mocks.getMcpCaller.mockReturnValue({ orgId: "org-1", scopes: ["admin"], via: "api-key" })
    mocks.assertCanCreateProduct.mockRejectedValue(limitReached)

    await expect(tools().get("adminCreateProduct")?.({ name: { en: "Mug" } })).rejects.toThrow(limitReached)
    expect(mocks.assertCanCreateProduct).toHaveBeenCalledWith("org-1")
    expect(mocks.createProduct).not.toHaveBeenCalled()
  })

  it("lets a product through under the limit", async () => {
    mocks.getMcpCaller.mockReturnValue({ orgId: "org-1", scopes: ["admin"], via: "api-key" })

    await expect(tools().get("adminCreateProduct")?.({ name: { en: "Mug" } })).resolves.toBeDefined()
    expect(mocks.createProduct).toHaveBeenCalledOnce()
  })
})

describe("the tools a caller is offered", () => {
  it("hides admin tools from a storefront key", () => {
    mocks.getMcpCaller.mockReturnValue({ orgId: "org-1", scopes: ["storefront"], via: "api-key" })
    const names = [...tools().keys()]

    expect(names).toContain("listProducts")
    expect(names.filter((name) => name.startsWith("admin"))).toEqual([])
  })

  it("offers an agent only what it was granted", () => {
    mocks.getMcpCaller.mockReturnValue({
      orgId: "org-1",
      scopes: ["storefront"],
      via: "agent",
      capabilities: ["listProducts"],
    })

    expect([...tools().keys()]).toEqual(["listProducts"])
  })

  it("tells an agent what's true for it, not for a key", async () => {
    mocks.getMcpCaller.mockReturnValue({
      orgId: "org-1",
      scopes: ["storefront"],
      via: "agent",
      capabilities: ["adminGetDashboard"],
    })

    await expect(tools().get("adminGetDashboard")?.({})).rejects.toThrow("AI agent")
  })
})
