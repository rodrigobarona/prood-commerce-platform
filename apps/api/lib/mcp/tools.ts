import type { McpServer } from "@modelcontextprotocol/server"
import { createGuestCustomer, ensureCustomer, getCart } from "@prood/commerce"
import { CommerceError } from "@prood/types"
import { z } from "zod"
import { admin, carts, catalog, orders } from "@/lib/commerce-service"
import { checkout } from "@/lib/commerce-service"
import { assertCapability } from "@/lib/agent-capability"
import { getMcpCaller } from "@/lib/mcp/context"
import {
  addToCartBody,
  adminListOrdersQuery,
  adminListQuery,
  cancelOrderBody,
  couponBody,
  checkoutAddressBody,
  createCategoryBody,
  createProductBody,
  fulfillOrderBody,
  getOrderQuery,
  listCustomerOrdersQuery,
  placeOrderBody,
  refundOrderBody,
  searchProductsQuery,
  setShippingMethodBody,
  updateCartItemBody,
  updateCategoryBody,
  updateInventoryBody,
  updateProductBody,
  updateStoreBody,
} from "@/lib/schemas"

function jsonContent(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    structuredContent: { data },
  }
}

function requireScope(scope: "storefront" | "admin") {
  const caller = getMcpCaller()
  if (!caller.scopes.includes(scope)) {
    throw new CommerceError(`Insufficient scope: requires ${scope}`, "FORBIDDEN")
  }
  return caller.orgId
}

async function placeOrderForCaller(cartId: string, email?: string, providerId?: string) {
  const caller = getMcpCaller()
  const orgId = requireScope("storefront")
  await checkout.assertPayable(orgId, cartId, providerId)
  let customerId: string | undefined
  if (caller.userId) {
    customerId = await ensureCustomer(orgId, caller.userId)
  } else {
    if (!email) {
      throw new CommerceError("An email is required to place a guest order", "VALIDATION", 422)
    }
    const cart = await getCart(cartId, orgId)
    const addr = cart.billingAddress ?? cart.shippingAddress
    customerId = await createGuestCustomer(orgId, {
      email: email ?? null,
      firstName: addr?.firstName ?? null,
      lastName: addr?.lastName ?? null,
      phone: addr?.phone ?? null,
    })
  }
  return checkout.placeOrder(orgId, cartId, customerId, email)
}

/** Tool names are the agent capability names, so check the grant in one place. */
function enforceAgentCapabilities(server: McpServer) {
  const registerTool = server.registerTool.bind(server)
  server.registerTool = ((name: string, config: never, handler: (...args: never[]) => unknown) =>
    registerTool(name, config, ((...args: never[]) => {
      const { capabilities } = getMcpCaller()
      if (capabilities) assertCapability(capabilities, name)
      return handler(...args)
    }) as never)) as typeof server.registerTool
}

export function registerCommerceMcpTools(server: McpServer) {
  enforceAgentCapabilities(server)

  server.registerTool(
    "listProducts",
    {
      title: "List products",
      description: "Search and list storefront products for the current tenant.",
      inputSchema: searchProductsQuery,
    },
    async (args) => {
      const orgId = requireScope("storefront")
      return jsonContent(await catalog.searchProducts(orgId, searchProductsQuery.parse(args)))
    }
  )

  server.registerTool(
    "getProduct",
    {
      title: "Get product",
      description: "Fetch a single product by id.",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await catalog.getProduct(orgId, id))
    }
  )

  server.registerTool(
    "getProductBySlug",
    {
      title: "Get product by slug",
      description: "Fetch a single product by its storefront URL slug.",
      inputSchema: z.object({ slug: z.string().min(1) }),
    },
    async ({ slug }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await catalog.getProductBySlug(orgId, slug))
    }
  )

  server.registerTool(
    "listCategories",
    {
      title: "List categories",
      description: "List product categories for the storefront.",
      inputSchema: z.object({
        parentId: z.string().optional(),
        depth: z.coerce.number().int().nonnegative().optional(),
      }),
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
    "getStore",
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
    "listCountries",
    {
      title: "List countries",
      description: "List countries supported by the current tenant.",
    },
    async () => {
      requireScope("storefront")
      return jsonContent(await catalog.listCountries())
    }
  )

  server.registerTool(
    "createCart",
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
    "getCart",
    {
      title: "Get cart",
      description: "Fetch a cart by id.",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.get(orgId, id))
    }
  )

  server.registerTool(
    "addCartItem",
    {
      title: "Add cart item",
      description: "Add a line item to a cart.",
      inputSchema: z.object({
        cartId: z.string().min(1),
        ...addToCartBody.shape,
      }),
    },
    async ({ cartId, ...item }) => {
      const orgId = requireScope("storefront")
      const body = addToCartBody.parse(item)
      return jsonContent(await carts.addItem(orgId, cartId, body))
    }
  )

  server.registerTool(
    "updateCartItem",
    {
      title: "Update cart item",
      description: "Update quantity for a cart line item.",
      inputSchema: z.object({
        cartId: z.string().min(1),
        itemId: z.string().min(1),
        ...updateCartItemBody.shape,
      }),
    },
    async ({ cartId, itemId, ...body }) => {
      const orgId = requireScope("storefront")
      const { quantity } = updateCartItemBody.parse(body)
      return jsonContent(await carts.updateItem(orgId, cartId, itemId, quantity))
    }
  )

  server.registerTool(
    "removeCartItem",
    {
      title: "Remove cart item",
      inputSchema: z.object({
        cartId: z.string().min(1),
        itemId: z.string().min(1),
      }),
    },
    async ({ cartId, itemId }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.removeItem(orgId, cartId, itemId))
    }
  )

  server.registerTool(
    "applyCartCoupon",
    {
      title: "Apply cart coupon",
      inputSchema: z.object({ cartId: z.string().min(1), ...couponBody.shape }),
    },
    async ({ cartId, code }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.applyCoupon(orgId, cartId, code))
    }
  )

  server.registerTool(
    "removeCartCoupon",
    {
      title: "Remove cart coupon",
      inputSchema: z.object({ cartId: z.string().min(1) }),
    },
    async ({ cartId }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await carts.removeCoupon(orgId, cartId))
    }
  )

  server.registerTool(
    "listCartShippingMethods",
    {
      title: "List cart shipping methods",
      inputSchema: z.object({ cartId: z.string().min(1) }),
    },
    async ({ cartId }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await checkout.getShippingMethods(orgId, cartId))
    }
  )

  server.registerTool(
    "listCartPaymentMethods",
    {
      title: "List cart payment methods",
      inputSchema: z.object({ cartId: z.string().min(1) }),
    },
    async ({ cartId }) => {
      const orgId = requireScope("storefront")
      return jsonContent(await checkout.getPaymentMethods(orgId, cartId))
    }
  )

  server.registerTool(
    "setCartShippingAddress",
    {
      title: "Set cart shipping address",
      inputSchema: z.object({ cartId: z.string().min(1), ...checkoutAddressBody.shape }),
    },
    async ({ cartId, ...address }) => {
      const orgId = requireScope("storefront")
      return jsonContent(
        await checkout.setShippingAddress(orgId, cartId, checkoutAddressBody.parse(address))
      )
    }
  )

  server.registerTool(
    "setCartBillingAddress",
    {
      title: "Set cart billing address",
      inputSchema: z.object({ cartId: z.string().min(1), ...checkoutAddressBody.shape }),
    },
    async ({ cartId, ...address }) => {
      const orgId = requireScope("storefront")
      return jsonContent(
        await checkout.setBillingAddress(orgId, cartId, checkoutAddressBody.parse(address))
      )
    }
  )

  server.registerTool(
    "setCartShippingMethod",
    {
      title: "Set cart shipping method",
      inputSchema: z.object({ cartId: z.string().min(1), ...setShippingMethodBody.shape }),
    },
    async ({ cartId, ...body }) => {
      const orgId = requireScope("storefront")
      const { methodId } = setShippingMethodBody.parse(body)
      return jsonContent(await checkout.setShippingMethod(orgId, cartId, methodId))
    }
  )

  server.registerTool(
    "placeOrder",
    {
      title: "Place order",
      description: "Turn a cart into an order. Guests must send an email.",
      inputSchema: z.object({ cartId: z.string().min(1), ...placeOrderBody.shape }),
    },
    async ({ cartId, ...body }) => {
      const { email, providerId } = placeOrderBody.parse(body)
      return jsonContent(await placeOrderForCaller(cartId, email, providerId))
    }
  )

  server.registerTool(
    "listOrders",
    {
      title: "List customer orders",
      inputSchema: listCustomerOrdersQuery,
    },
    async (args) => {
      const orgId = requireScope("storefront")
      return jsonContent(await orders.list(orgId, listCustomerOrdersQuery.parse(args)))
    }
  )

  server.registerTool(
    "getOrder",
    {
      title: "Get order",
      inputSchema: z.object({ id: z.string().min(1), ...getOrderQuery.shape }),
    },
    async ({ id, email }) => {
      requireScope("storefront")
      return jsonContent(await orders.getForCaller(getMcpCaller(), id, email))
    }
  )

  server.registerTool(
    "adminListProducts",
    {
      title: "Admin list products",
      inputSchema: adminListQuery,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.listProducts(orgId, adminListQuery.parse(args)))
    }
  )

  server.registerTool(
    "adminCreateProduct",
    {
      title: "Admin create product",
      inputSchema: createProductBody,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.createProduct(orgId, createProductBody.parse(args)))
    }
  )

  server.registerTool(
    "adminGetProduct",
    {
      title: "Admin get product",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.getProduct(orgId, id))
    }
  )

  server.registerTool(
    "adminUpdateProduct",
    {
      title: "Admin update product",
      inputSchema: z.object({ id: z.string().min(1), ...updateProductBody.shape }),
    },
    async ({ id, ...input }) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.updateProduct(orgId, id, updateProductBody.parse(input)))
    }
  )

  server.registerTool(
    "adminDeleteProduct",
    {
      title: "Admin delete product",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("admin")
      await admin.deleteProduct(orgId, id)
      return jsonContent({ success: true })
    }
  )

  server.registerTool(
    "adminCreateCategory",
    {
      title: "Admin create category",
      inputSchema: createCategoryBody,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.createCategory(orgId, createCategoryBody.parse(args)))
    }
  )

  server.registerTool(
    "adminUpdateCategory",
    {
      title: "Admin update category",
      inputSchema: z.object({ id: z.string().min(1), ...updateCategoryBody.shape }),
    },
    async ({ id, ...input }) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.updateCategory(orgId, id, updateCategoryBody.parse(input)))
    }
  )

  server.registerTool(
    "adminDeleteCategory",
    {
      title: "Admin delete category",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("admin")
      await admin.deleteCategory(orgId, id)
      return jsonContent({ success: true })
    }
  )

  server.registerTool(
    "adminListOrders",
    {
      title: "Admin list orders",
      inputSchema: adminListOrdersQuery,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.listOrders(orgId, adminListOrdersQuery.parse(args)))
    }
  )

  server.registerTool(
    "adminGetOrder",
    {
      title: "Admin get order",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.getOrder(orgId, id))
    }
  )

  server.registerTool(
    "adminCancelOrder",
    {
      title: "Admin cancel order",
      inputSchema: z.object({ id: z.string().min(1), ...cancelOrderBody.shape }),
    },
    async ({ id, ...body }) => {
      const orgId = requireScope("admin")
      const { note } = cancelOrderBody.parse(body)
      await admin.cancelOrder(orgId, id, note)
      return jsonContent({ success: true })
    }
  )

  server.registerTool(
    "adminGetOrderHistory",
    {
      title: "Admin get order history",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.getOrderHistory(orgId, id))
    }
  )

  server.registerTool(
    "adminFulfillOrder",
    {
      title: "Admin fulfill order",
      inputSchema: z.object({ id: z.string().min(1), ...fulfillOrderBody.shape }),
    },
    async ({ id, ...body }) => {
      const orgId = requireScope("admin")
      await admin.fulfillOrder(orgId, id, fulfillOrderBody.parse(body))
      return jsonContent({ success: true })
    }
  )

  server.registerTool(
    "adminRefundOrder",
    {
      title: "Admin refund order",
      description:
        "Sends real money back to the shopper through the store's payment provider, and can't be undone.",
      inputSchema: z.object({ id: z.string().min(1), ...refundOrderBody.shape }),
    },
    async ({ id, ...body }) => {
      const orgId = requireScope("admin")
      await admin.refundOrder(orgId, id, refundOrderBody.parse(body))
      return jsonContent({ success: true })
    }
  )

  server.registerTool(
    "adminListCustomers",
    {
      title: "Admin list customers",
      inputSchema: adminListQuery,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.listCustomers(orgId, adminListQuery.parse(args)))
    }
  )

  server.registerTool(
    "adminGetCustomer",
    {
      title: "Admin get customer",
      inputSchema: z.object({ id: z.string().min(1) }),
    },
    async ({ id }) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.getCustomer(orgId, id))
    }
  )

  server.registerTool(
    "adminGetStore",
    {
      title: "Admin get store settings",
    },
    async () => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.getStoreSettings(orgId))
    }
  )

  server.registerTool(
    "adminUpdateStore",
    {
      title: "Admin update store settings",
      inputSchema: updateStoreBody,
    },
    async (args) => {
      const orgId = requireScope("admin")
      return jsonContent(await admin.updateStoreSettings(orgId, updateStoreBody.parse(args)))
    }
  )

  server.registerTool(
    "adminUpdateInventory",
    {
      title: "Admin update inventory",
      inputSchema: updateInventoryBody,
    },
    async (args) => {
      const orgId = requireScope("admin")
      await admin.updateInventory(orgId, updateInventoryBody.parse(args))
      return jsonContent({ success: true })
    }
  )

  server.registerTool(
    "adminGetDashboard",
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
