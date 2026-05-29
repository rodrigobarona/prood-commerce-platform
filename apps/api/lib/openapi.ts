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

function pathItem(
  method: string,
  summary: string,
  options: {
    query?: z.ZodType
    body?: z.ZodType
    scope: "storefront" | "admin"
    responses?: Record<string, { description: string }>
  }
) {
  const parameters: object[] = []
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
        "Multi-tenant commerce HTTP API. Authenticate with `x-api-key` (org + scopes in key metadata), a Better Auth session cookie (dashboard), or resolve the tenant from the request `Host`.",
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
      "/health": pathItem("GET", "Health check", {
        scope: "storefront",
        responses: { "200": { description: "OK" } },
      }),
      "/me": pathItem("GET", "Resolved caller (tenant + scopes)", {
        scope: "storefront",
      }),
      "/products": pathItem("GET", "Search / list products", {
        scope: "storefront",
        query: searchProductsQuery,
      }),
      "/products/{id}": pathItem("GET", "Get product by id", {
        scope: "storefront",
      }),
      "/categories": pathItem("GET", "List categories", {
        scope: "storefront",
        query: categoriesQuery,
      }),
      "/store": pathItem("GET", "Store metadata", { scope: "storefront" }),
      "/countries": pathItem("GET", "Countries (shared reference data)", {
        scope: "storefront",
      }),
      "/carts": pathItem("POST", "Create cart", {
        scope: "storefront",
        responses: { "201": { description: "Cart created" } },
      }),
      "/carts/{id}": pathItem("GET", "Get cart", { scope: "storefront" }),
      "/carts/{id}/items": pathItem("POST", "Add cart item", {
        scope: "storefront",
        body: addToCartBody,
        responses: { "201": { description: "Item added" } },
      }),
      "/carts/{id}/items/{itemId}": {
        ...pathItem("PATCH", "Update cart item quantity", {
          scope: "storefront",
          body: updateCartItemBody,
        }),
        ...pathItem("DELETE", "Remove cart item", { scope: "storefront" }),
      },
      "/carts/{id}/coupon": {
        ...pathItem("POST", "Apply coupon", {
          scope: "storefront",
          body: couponBody,
        }),
        ...pathItem("DELETE", "Remove coupon", { scope: "storefront" }),
      },
      "/orders/{id}": pathItem("GET", "Get order by id", {
        scope: "storefront",
      }),
      "/admin/products": {
        ...pathItem("GET", "List products (admin)", {
          scope: "admin",
          query: adminListQuery,
        }),
        ...pathItem("POST", "Create product", {
          scope: "admin",
          body: createProductBody,
          responses: { "201": { description: "Product created" } },
        }),
      },
      "/admin/products/{id}": {
        ...pathItem("GET", "Get product (admin)", { scope: "admin" }),
        ...pathItem("PATCH", "Update product", {
          scope: "admin",
          body: updateProductBody,
        }),
        ...pathItem("DELETE", "Delete product", {
          scope: "admin",
          responses: { "204": { description: "Deleted" } },
        }),
      },
      "/admin/categories": pathItem("POST", "Create category", {
        scope: "admin",
        body: createCategoryBody,
        responses: { "201": { description: "Category created" } },
      }),
      "/admin/categories/{id}": {
        ...pathItem("PATCH", "Update category", {
          scope: "admin",
          body: updateCategoryBody,
        }),
        ...pathItem("DELETE", "Delete category", {
          scope: "admin",
          responses: { "204": { description: "Deleted" } },
        }),
      },
      "/admin/orders": pathItem("GET", "List orders (admin)", {
        scope: "admin",
        query: adminListOrdersQuery,
      }),
      "/admin/orders/{id}": pathItem("GET", "Get order (admin)", {
        scope: "admin",
      }),
      "/admin/orders/{id}/fulfill": pathItem("POST", "Fulfill order", {
        scope: "admin",
        body: fulfillOrderBody,
      }),
      "/admin/customers": pathItem("GET", "List customers", {
        scope: "admin",
        query: adminListQuery,
      }),
      "/admin/customers/{id}": pathItem("GET", "Get customer", {
        scope: "admin",
      }),
      "/admin/store": {
        ...pathItem("GET", "Store settings", { scope: "admin" }),
        ...pathItem("PATCH", "Update store settings", {
          scope: "admin",
          body: updateStoreBody,
        }),
      },
      "/admin/inventory": pathItem("POST", "Update inventory", {
        scope: "admin",
        body: updateInventoryBody,
      }),
      "/admin/dashboard": pathItem("GET", "Dashboard stats", {
        scope: "admin",
      }),
    },
  }
}
