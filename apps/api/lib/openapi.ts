import { z } from "zod"
import {
  addToCartBody,
  adminListOrdersQuery,
  adminListQuery,
  categoriesQuery,
  couponBody,
  createCategoryBody,
  createProductBody,
  fulfillOrderBody,
  refundOrderBody,
  checkoutAddressBody,
  setShippingMethodBody,
  listCustomerOrdersQuery,
  searchProductsQuery,
  updateCartItemBody,
  updateCategoryBody,
  updateInventoryBody,
  updateProductBody,
  updateStoreBody,
} from "./schemas"

// ---------------------------------------------------------------------------
// OpenAPI 3.1 contract — generated from the same Zod schemas that validate
// requests. No third-party docs UI; consumers read /v1/openapi.json directly.
// ---------------------------------------------------------------------------

const errorBody = z.object({
  code: z.string(),
  message: z.string(),
  errors: z
    .array(z.object({ path: z.string(), message: z.string() }))
    .optional(),
})

function schema(def: z.ZodType) {
  return z.toJSONSchema(def)
}

function pathParametersFromTemplate(pathTemplate: string): object[] {
  return [...pathTemplate.matchAll(/\{([^}]+)\}/g)].map(([, name]) => ({
    name,
    in: "path",
    required: true,
    schema: { type: "string" },
  }))
}

function pathItem(
  method: string,
  summary: string,
  operationId: string,
  options: {
    pathTemplate?: string
    query?: z.ZodType
    body?: z.ZodType
    scope: "storefront" | "admin"
    responses?: Record<string, { description: string }>
  }
) {
  const parameters: object[] = options.pathTemplate
    ? pathParametersFromTemplate(options.pathTemplate)
    : []
  if (options.query) {
    const json = schema(options.query) as {
      properties?: Record<string, { type?: string; enum?: string[] }>
    }
    for (const [name, prop] of Object.entries(json.properties ?? {})) {
      parameters.push({
        name,
        in: "query",
        schema: prop,
        required: (json as { required?: string[] }).required?.includes(name),
      })
    }
  }

  const op: Record<string, unknown> = {
    operationId,
    summary,
    tags: [options.scope === "admin" ? "Admin" : "Storefront"],
    security: [{ apiKey: [] }, { sessionCookie: [] }],
    parameters: parameters.length ? parameters : undefined,
    responses: {
      "401": { description: "Unauthorized", content: { "application/json": { schema: schema(errorBody) } } },
      "403": { description: "Forbidden", content: { "application/json": { schema: schema(errorBody) } } },
      "422": { description: "Validation error", content: { "application/json": { schema: schema(errorBody) } } },
      ...options.responses,
      "200": options.responses?.["200"] ?? { description: "Success" },
      "201": options.responses?.["201"],
    },
  }

  if (options.body) {
    op.requestBody = {
      required: true,
      content: { "application/json": { schema: schema(options.body) } },
    }
  }

  return { [method.toLowerCase()]: op }
}

export function buildOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Prood Commerce API",
      version: "1.0.0",
      description:
        "Multi-tenant commerce HTTP API. Authenticate with Agent Auth (Bearer JWT + capability grants), `x-api-key` (org + scopes in key metadata), a Better Auth session cookie (dashboard), or resolve the tenant from the request `Host`. Agent discovery: `/.well-known/agent-configuration`.",
    },
    servers: [{ url: "/v1" }],
    components: {
      securitySchemes: {
        apiKey: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Better Auth session (first-party dashboard)",
        },
      },
    },
    paths: {
      "/health": pathItem("GET", "Health check", "getHealth", {
        scope: "storefront",
        responses: { "200": { description: "OK" } },
      }),
      "/me": pathItem("GET", "Resolved caller (tenant + scopes)", "getMe", {
        scope: "storefront",
      }),
      "/products": pathItem("GET", "Search / list products", "listProducts", {
        scope: "storefront",
        query: searchProductsQuery,
      }),
      "/products/{id}": pathItem("GET", "Get product by id", "getProduct", {
        pathTemplate: "/products/{id}",
        scope: "storefront",
      }),
      "/categories": pathItem("GET", "List categories", "listCategories", {
        scope: "storefront",
        query: categoriesQuery,
      }),
      "/store": pathItem("GET", "Store metadata", "getStore", {
        scope: "storefront",
      }),
      "/countries": pathItem("GET", "Countries (shared reference data)", "listCountries", {
        scope: "storefront",
      }),
      "/carts": pathItem("POST", "Create cart", "createCart", {
        scope: "storefront",
        responses: { "201": { description: "Cart created" } },
      }),
      "/carts/{id}": pathItem("GET", "Get cart", "getCart", {
        pathTemplate: "/carts/{id}",
        scope: "storefront",
      }),
      "/carts/{id}/items": pathItem("POST", "Add cart item", "addCartItem", {
        pathTemplate: "/carts/{id}/items",
        scope: "storefront",
        body: addToCartBody,
        responses: { "201": { description: "Item added" } },
      }),
      "/carts/{id}/items/{itemId}": {
        ...pathItem("PATCH", "Update cart item quantity", "updateCartItem", {
          pathTemplate: "/carts/{id}/items/{itemId}",
          scope: "storefront",
          body: updateCartItemBody,
        }),
        ...pathItem("DELETE", "Remove cart item", "removeCartItem", {
          pathTemplate: "/carts/{id}/items/{itemId}",
          scope: "storefront",
        }),
      },
      "/carts/{id}/coupon": {
        ...pathItem("POST", "Apply coupon", "applyCartCoupon", {
          pathTemplate: "/carts/{id}/coupon",
          scope: "storefront",
          body: couponBody,
        }),
        ...pathItem("DELETE", "Remove coupon", "removeCartCoupon", {
          pathTemplate: "/carts/{id}/coupon",
          scope: "storefront",
        }),
      },
      "/carts/{id}/shipping-methods": pathItem(
        "GET",
        "List shipping methods for cart",
        "listCartShippingMethods",
        { pathTemplate: "/carts/{id}/shipping-methods", scope: "storefront" }
      ),
      "/carts/{id}/payment-methods": pathItem(
        "GET",
        "List payment methods for cart",
        "listCartPaymentMethods",
        { pathTemplate: "/carts/{id}/payment-methods", scope: "storefront" }
      ),
      "/carts/{id}/shipping-address": pathItem(
        "PUT",
        "Set shipping address",
        "setCartShippingAddress",
        {
          pathTemplate: "/carts/{id}/shipping-address",
          scope: "storefront",
          body: checkoutAddressBody,
        }
      ),
      "/carts/{id}/billing-address": pathItem(
        "PUT",
        "Set billing address",
        "setCartBillingAddress",
        {
          pathTemplate: "/carts/{id}/billing-address",
          scope: "storefront",
          body: checkoutAddressBody,
        }
      ),
      "/carts/{id}/shipping-method": pathItem(
        "PATCH",
        "Select shipping method",
        "setCartShippingMethod",
        {
          pathTemplate: "/carts/{id}/shipping-method",
          scope: "storefront",
          body: setShippingMethodBody,
        }
      ),
      "/carts/{id}/place-order": pathItem("POST", "Place order from cart", "placeOrder", {
        pathTemplate: "/carts/{id}/place-order",
        scope: "storefront",
        responses: { "201": { description: "Order created" } },
      }),
      "/orders": pathItem("GET", "List customer orders", "listOrders", {
        scope: "storefront",
        query: listCustomerOrdersQuery,
      }),
      "/orders/{id}": pathItem("GET", "Get order by id", "getOrder", {
        pathTemplate: "/orders/{id}",
        scope: "storefront",
      }),
      "/admin/products": {
        ...pathItem("GET", "List products (admin)", "adminListProducts", {
          scope: "admin",
          query: adminListQuery,
        }),
        ...pathItem("POST", "Create product", "adminCreateProduct", {
          scope: "admin",
          body: createProductBody,
          responses: { "201": { description: "Product created" } },
        }),
      },
      "/admin/products/{id}": {
        ...pathItem("GET", "Get product (admin)", "adminGetProduct", {
          pathTemplate: "/admin/products/{id}",
          scope: "admin",
        }),
        ...pathItem("PATCH", "Update product", "adminUpdateProduct", {
          pathTemplate: "/admin/products/{id}",
          scope: "admin",
          body: updateProductBody,
        }),
        ...pathItem("DELETE", "Delete product", "adminDeleteProduct", {
          pathTemplate: "/admin/products/{id}",
          scope: "admin",
          responses: { "204": { description: "Deleted" } },
        }),
      },
      "/admin/categories": pathItem("POST", "Create category", "adminCreateCategory", {
        scope: "admin",
        body: createCategoryBody,
        responses: { "201": { description: "Category created" } },
      }),
      "/admin/categories/{id}": {
        ...pathItem("PATCH", "Update category", "adminUpdateCategory", {
          pathTemplate: "/admin/categories/{id}",
          scope: "admin",
          body: updateCategoryBody,
        }),
        ...pathItem("DELETE", "Delete category", "adminDeleteCategory", {
          pathTemplate: "/admin/categories/{id}",
          scope: "admin",
          responses: { "204": { description: "Deleted" } },
        }),
      },
      "/admin/orders": pathItem("GET", "List orders (admin)", "adminListOrders", {
        scope: "admin",
        query: adminListOrdersQuery,
      }),
      "/admin/orders/{id}": pathItem("GET", "Get order (admin)", "adminGetOrder", {
        pathTemplate: "/admin/orders/{id}",
        scope: "admin",
      }),
      "/admin/orders/{id}/fulfill": pathItem("POST", "Fulfill order", "adminFulfillOrder", {
        pathTemplate: "/admin/orders/{id}/fulfill",
        scope: "admin",
        body: fulfillOrderBody,
      }),
      "/admin/orders/{id}/refund": pathItem("POST", "Refund order", "adminRefundOrder", {
        pathTemplate: "/admin/orders/{id}/refund",
        scope: "admin",
        body: refundOrderBody,
      }),
      "/admin/customers": pathItem("GET", "List customers", "adminListCustomers", {
        scope: "admin",
        query: adminListQuery,
      }),
      "/admin/customers/{id}": pathItem("GET", "Get customer", "adminGetCustomer", {
        pathTemplate: "/admin/customers/{id}",
        scope: "admin",
      }),
      "/admin/store": {
        ...pathItem("GET", "Store settings", "adminGetStore", { scope: "admin" }),
        ...pathItem("PATCH", "Update store settings", "adminUpdateStore", {
          scope: "admin",
          body: updateStoreBody,
        }),
      },
      "/admin/inventory": pathItem("POST", "Update inventory", "adminUpdateInventory", {
        scope: "admin",
        body: updateInventoryBody,
      }),
      "/admin/dashboard": pathItem("GET", "Dashboard stats", "adminGetDashboard", {
        scope: "admin",
      }),
    },
  }
}
