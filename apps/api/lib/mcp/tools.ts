import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"
import { admin, carts, catalog, orders } from "@/lib/commerce-service"
import { getMcpCaller } from "@/lib/mcp/context"
import {
  addToCartBody,
  adminListOrdersQuery,
  adminListQuery,
  couponBody,
  createProductBody,
  searchProductsQuery,
  updateCartItemBody,
} from "@/lib/schemas"

function jsonContent(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  }
}

function requireScope(scope: "storefront" | "admin") {
  const caller = getMcpCaller()
  if (!caller.scopes.includes(scope)) {
    throw new Error(`Insufficient scope: requires ${scope}`)
  }
  return caller.orgId
}

export function registerCommerceMcpTools(server: McpServer) {
  server.registerTool(
    "list_products",
    {
      title: "List products",
      description: "Search and list storefront products for the current tenant.",
      inputSchema: searchProductsQuery.shape,
    },
    async (args) => {
      const orgId = requireScope("storefront")
      return jsonContent(await catalog.searchProducts(orgId, searchProductsQuery.parse(args)))
    }
  )

  server.registerTool(
    "get_product",
    {
      title: "Get product",
      description: "Fetch a single product by id.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await catalog.getProduct(orgId, id))
    }
  )

  server.registerTool(
    "list_categories",
    {
      title: "List categories",
      description: "List product categories for the storefront.",
      inputSchema: {
        parentId: z.string().optional(),
        depth: z.coerce.number().int().nonnegative().optional(),
      },
    },
    async (args) => {
      const orgId = requireScope("storefront")
      return jsonContent(
        await catalog.listCategories(orgId, {
          parentId: args.parentId,
          depth: args.depth,
        })
      )
    }
  )

  server.registerTool(
    "get_store",
    {
      title: "Get store",
      description: "Store metadata for the current tenant.",
    },
    async () => {
      const orgId = requireScope("storefront")
      return jsonContent(await catalog.getStore(orgId))
    }
  )

  server.registerTool(
    "create_cart",
    {
      title: "Create cart",
      description: "Create a new shopping cart.",
    },
    async () => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.create(orgId))
    }
  )

  server.registerTool(
    "get_cart",
    {
      title: "Get cart",
      description: "Fetch a cart by id.",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.get(orgId, id))
    }
  )

  server.registerTool(
    "add_cart_item",
    {
      title: "Add cart item",
      description: "Add a line item to a cart.",
      inputSchema: {
        cartId: z.string().min(1),
        ...addToCartBody.shape,
      },
    },
    async ({ cartId, ...item }) => {
      const orgId = requireScope("storefront")
      const body = addToCartBody.parse(item)
      return jsonContent(await carts.addItem(orgId, cartId, body))
    }
  )

  server.registerTool(
    "update_cart_item",
    {
      title: "Update cart item",
      description: "Update quantity for a cart line item.",
      inputSchema: {
        cartId: z.string().min(1),
        itemId: z.string().min(1),
        ...updateCartItemBody.shape,
      },
    },
    async ({ cartId, itemId, ...body }) => {
      const orgId = requireScope("storefront")
      const { quantity } = updateCartItemBody.parse(body)
      return jsonContent(await carts.updateItem(orgId, cartId, itemId, quantity))
    }
  )

  server.registerTool(
    "apply_cart_coupon",
    {
      title: "Apply cart coupon",
      inputSchema: { cartId: z.string().min(1), ...couponBody.shape },
    },
    async ({ cartId, code }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.applyCoupon(orgId, cartId, code))
    }
  )

  server.registerTool(
    "get_order",
    {
      title: "Get order",
      inputSchema: { id: z.string().min(1) },
    },
    async ({ id }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await orders.get(orgId, id))
    }
  )

  server.registerTool(
    "admin_list_products",
    {
      title: "Admin list products",
      inputSchema: adminListQuery.shape,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.listProducts(orgId, adminListQuery.parse(args)))
    }
  )

  server.registerTool(
    "admin_create_product",
    {
      title: "Admin create product",
      inputSchema: createProductBody.shape,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.createProduct(orgId, createProductBody.parse(args)))
    }
  )

  server.registerTool(
    "admin_list_orders",
    {
      title: "Admin list orders",
      inputSchema: adminListOrdersQuery.shape,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.listOrders(orgId, adminListOrdersQuery.parse(args)))
    }
  )

  server.registerTool(
    "admin_get_dashboard",
    {
      title: "Admin dashboard stats",
      description: "Aggregate dashboard metrics for the tenant.",
    },
    async () => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.dashboardStats(orgId))
    }
  )
}
