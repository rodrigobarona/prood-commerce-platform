import { z } from "zod"
import {
  addToCartBody,
  adminListOrdersQuery,
  adminListQuery,
  cancelOrderBody,
  categoriesQuery,
  couponBody,
  createCategoryBody,
  createProductBody,
  fulfillOrderBody,
  refundOrderBody,
  checkoutAddressBody,
  placeOrderBody,
  setShippingMethodBody,
  listCustomerOrdersQuery,
  searchProductsQuery,
  updateCartItemBody,
  updateCategoryBody,
  updateInventoryBody,
  updateProductBody,
  updateStoreBody,
} from "./schemas"
import * as responses from "./response-schemas"

// ---------------------------------------------------------------------------
// OpenAPI 3.1 contract — generated from the same Zod schemas that validate
// requests. No third-party docs UI; consumers read /v1/openapi.json directly.
// ---------------------------------------------------------------------------

function schema(def: z.ZodType) {
  return z.toJSONSchema(def)
}

type OpenApiSecurity = Record<string, string[]>[]
type ApiResponse = {
  description: string
  schema?: z.ZodType
}

const storefrontSecurity: OpenApiSecurity = [
  { bearerAuth: [] },
  { apiKey: [] },
  { sessionCookie: [] },
  { storefrontHost: [] },
]

const adminSecurity: OpenApiSecurity = [
  { bearerAuth: [] },
  { apiKey: [] },
  { sessionCookie: [] },
]

const webhookSecurity: OpenApiSecurity = [
  { checkoutSecret: [] },
  { stripeSignature: [] },
]

function response(def: ApiResponse) {
  if (!def.schema) return { description: def.description }
  return {
    description: def.description,
    content: { "application/json": { schema: schema(def.schema) } },
  }
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
    tag?: string
    public?: boolean
    security?: OpenApiSecurity
    response?: z.ZodType
    responses?: Record<string, ApiResponse>
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
    tags: [options.tag ?? (options.scope === "admin" ? "Admin" : "Storefront")],
    security: options.public
      ? []
      : (options.security ??
        (options.scope === "admin" ? adminSecurity : storefrontSecurity)),
    parameters: parameters.length ? parameters : undefined,
    responses: {
      ...(options.public
        ? {}
        : {
            "401": response({
              description: "Unauthorized",
              schema: responses.errorBody,
            }),
            "403": response({
              description: "Forbidden",
              schema: responses.errorBody,
            }),
          }),
      "422": response({
        description: "Validation error",
        schema: responses.errorBody,
      }),
      ...Object.fromEntries(
        Object.entries(options.responses ?? {}).map(([status, def]) => [
          status,
          response(def),
        ])
      ),
      ...(!options.responses?.["200"] && options.response
        ? {
            "200": response({
              description: "Success",
              schema: options.response,
            }),
          }
        : {}),
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
          description: "Organization-scoped API key with scope metadata.",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Agent Auth JWT with capability grants.",
        },
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "better-auth.session_token",
          description: "Better Auth session (first-party dashboard)",
        },
        storefrontHost: {
          type: "apiKey",
          in: "header",
          name: "x-storefront-host",
          description: "Storefront tenant host for storefront-scoped calls.",
        },
        checkoutSecret: {
          type: "apiKey",
          in: "header",
          name: "x-checkout-secret",
          description: "Shared secret used by the checkout service for payment webhook forwarding.",
        },
        stripeSignature: {
          type: "apiKey",
          in: "header",
          name: "stripe-signature",
          description: "Stripe webhook signature for direct Stripe callbacks.",
        },
      },
    },
    paths: {
      "/health": pathItem("GET", "Health check", "getHealth", {
        scope: "storefront",
        public: true,
        response: responses.healthBody,
      }),
      "/me": pathItem("GET", "Resolved caller (tenant + scopes)", "getMe", {
        scope: "storefront",
        response: responses.callerBody,
      }),
      "/products": pathItem("GET", "Search / list products", "listProducts", {
        scope: "storefront",
        query: searchProductsQuery,
        response: responses.searchResult,
      }),
      "/products/{id}": pathItem("GET", "Get product by id", "getProduct", {
        pathTemplate: "/products/{id}",
        scope: "storefront",
        response: responses.product,
      }),
      "/categories": pathItem("GET", "List categories", "listCategories", {
        scope: "storefront",
        query: categoriesQuery,
        response: z.array(responses.category),
      }),
      "/store": pathItem("GET", "Store metadata", "getStore", {
        scope: "storefront",
        response: responses.storeInfo,
      }),
      "/countries": pathItem("GET", "Countries (shared reference data)", "listCountries", {
        scope: "storefront",
        response: z.array(responses.country),
      }),
      "/carts": pathItem("POST", "Create cart", "createCart", {
        scope: "storefront",
        responses: { "201": { description: "Cart created", schema: responses.cart } },
      }),
      "/carts/{id}": pathItem("GET", "Get cart", "getCart", {
        pathTemplate: "/carts/{id}",
        scope: "storefront",
        response: responses.cart,
      }),
      "/carts/{id}/items": pathItem("POST", "Add cart item", "addCartItem", {
        pathTemplate: "/carts/{id}/items",
        scope: "storefront",
        body: addToCartBody,
        responses: { "201": { description: "Item added", schema: responses.cart } },
      }),
      "/carts/{id}/items/{itemId}": {
        ...pathItem("PATCH", "Update cart item quantity", "updateCartItem", {
          pathTemplate: "/carts/{id}/items/{itemId}",
          scope: "storefront",
          body: updateCartItemBody,
          response: responses.cart,
        }),
        ...pathItem("DELETE", "Remove cart item", "removeCartItem", {
          pathTemplate: "/carts/{id}/items/{itemId}",
          scope: "storefront",
          response: responses.cart,
        }),
      },
      "/carts/{id}/coupon": {
        ...pathItem("POST", "Apply coupon", "applyCartCoupon", {
          pathTemplate: "/carts/{id}/coupon",
          scope: "storefront",
          body: couponBody,
          response: responses.cart,
        }),
        ...pathItem("DELETE", "Remove coupon", "removeCartCoupon", {
          pathTemplate: "/carts/{id}/coupon",
          scope: "storefront",
          response: responses.cart,
        }),
      },
      "/carts/{id}/shipping-methods": pathItem(
        "GET",
        "List shipping methods for cart",
        "listCartShippingMethods",
        {
          pathTemplate: "/carts/{id}/shipping-methods",
          scope: "storefront",
          response: z.array(responses.shippingMethod),
        }
      ),
      "/carts/{id}/payment-methods": pathItem(
        "GET",
        "List payment methods for cart",
        "listCartPaymentMethods",
        {
          pathTemplate: "/carts/{id}/payment-methods",
          scope: "storefront",
          response: z.array(responses.paymentMethod),
        }
      ),
      "/carts/{id}/shipping-address": pathItem(
        "PUT",
        "Set shipping address",
        "setCartShippingAddress",
        {
          pathTemplate: "/carts/{id}/shipping-address",
          scope: "storefront",
          body: checkoutAddressBody,
          response: responses.cart,
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
          response: responses.cart,
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
          response: responses.cart,
        }
      ),
      "/carts/{id}/place-order": pathItem("POST", "Place order from cart", "placeOrder", {
        pathTemplate: "/carts/{id}/place-order",
        scope: "storefront",
        body: placeOrderBody,
        responses: { "201": { description: "Order created", schema: responses.order } },
      }),
      "/orders": pathItem("GET", "List customer orders", "listOrders", {
        scope: "storefront",
        query: listCustomerOrdersQuery,
        response: responses.paginated(responses.order),
      }),
      "/orders/{id}": pathItem("GET", "Get order by id", "getOrder", {
        pathTemplate: "/orders/{id}",
        scope: "storefront",
        response: responses.order,
      }),
      "/admin/products": {
        ...pathItem("GET", "List products (admin)", "adminListProducts", {
          scope: "admin",
          query: adminListQuery,
          response: responses.paginated(responses.product),
        }),
        ...pathItem("POST", "Create product", "adminCreateProduct", {
          scope: "admin",
          body: createProductBody,
          responses: {
            "201": { description: "Product created", schema: responses.product },
          },
        }),
      },
      "/admin/products/{id}": {
        ...pathItem("GET", "Get product (admin)", "adminGetProduct", {
          pathTemplate: "/admin/products/{id}",
          scope: "admin",
          response: responses.product,
        }),
        ...pathItem("PATCH", "Update product", "adminUpdateProduct", {
          pathTemplate: "/admin/products/{id}",
          scope: "admin",
          body: updateProductBody,
          response: responses.product,
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
        responses: {
          "201": { description: "Category created", schema: responses.category },
        },
      }),
      "/admin/categories/{id}": {
        ...pathItem("PATCH", "Update category", "adminUpdateCategory", {
          pathTemplate: "/admin/categories/{id}",
          scope: "admin",
          body: updateCategoryBody,
          response: responses.category,
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
        response: responses.paginated(responses.order),
      }),
      "/admin/orders/{id}": pathItem("GET", "Get order (admin)", "adminGetOrder", {
        pathTemplate: "/admin/orders/{id}",
        scope: "admin",
        response: responses.order,
      }),
      "/admin/orders/{id}/cancel": pathItem("POST", "Cancel order", "adminCancelOrder", {
        pathTemplate: "/admin/orders/{id}/cancel",
        scope: "admin",
        body: cancelOrderBody,
        response: responses.successBody,
      }),
      "/admin/orders/{id}/history": pathItem("GET", "Get order history", "adminGetOrderHistory", {
        pathTemplate: "/admin/orders/{id}/history",
        scope: "admin",
        response: z.array(responses.orderHistoryEntry),
      }),
      "/admin/orders/{id}/fulfill": pathItem("POST", "Fulfill order", "adminFulfillOrder", {
        pathTemplate: "/admin/orders/{id}/fulfill",
        scope: "admin",
        body: fulfillOrderBody,
        response: responses.successBody,
      }),
      "/admin/orders/{id}/refund": pathItem("POST", "Refund order", "adminRefundOrder", {
        pathTemplate: "/admin/orders/{id}/refund",
        scope: "admin",
        body: refundOrderBody,
        response: responses.successBody,
      }),
      "/admin/customers": pathItem("GET", "List customers", "adminListCustomers", {
        scope: "admin",
        query: adminListQuery,
        response: responses.paginated(responses.customer),
      }),
      "/admin/customers/{id}": pathItem("GET", "Get customer", "adminGetCustomer", {
        pathTemplate: "/admin/customers/{id}",
        scope: "admin",
        response: responses.customer,
      }),
      "/admin/store": {
        ...pathItem("GET", "Store settings", "adminGetStore", {
          scope: "admin",
          response: responses.adminStoreSettings,
        }),
        ...pathItem("PATCH", "Update store settings", "adminUpdateStore", {
          scope: "admin",
          body: updateStoreBody,
          response: responses.adminStoreSettings,
        }),
      },
      "/admin/inventory": pathItem("POST", "Update inventory", "adminUpdateInventory", {
        scope: "admin",
        body: updateInventoryBody,
        response: responses.successBody,
      }),
      "/admin/dashboard": pathItem("GET", "Dashboard stats", "adminGetDashboard", {
        scope: "admin",
        response: responses.adminDashboardStats,
      }),
      "/webhooks/payments/{provider}": {
        ...pathItem("POST", "Payment webhook (checkout service)", "paymentWebhook", {
          pathTemplate: "/webhooks/payments/{provider}",
          scope: "storefront",
          tag: "Webhooks",
          security: webhookSecurity,
          responses: {
            "200": {
              description: "Webhook accepted",
              schema: responses.webhookAcceptedBody,
            },
          },
        }),
        ...pathItem("GET", "Payment webhook GET (IfThenPay)", "paymentWebhookGet", {
          pathTemplate: "/webhooks/payments/{provider}",
          scope: "storefront",
          tag: "Webhooks",
          security: webhookSecurity,
          responses: {
            "200": {
              description: "Webhook accepted",
              schema: responses.webhookAcceptedBody,
            },
          },
        }),
      },
    },
  }
}
