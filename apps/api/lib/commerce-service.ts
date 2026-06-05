import "server-only"
import {
  getProducts,
  getProduct,
  getCategories,
  getStoreInfo,
  getCountries,
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  applyCoupon,
  removeCoupon,
  getOrder,
  getCustomerOrders,
  getShippingMethods,
  getPaymentMethods,
  setShippingAddress,
  setBillingAddress,
  setShippingMethod,
  placeOrder,
  getAdmin,
  withTenant,
  getAdapter,
  verifyPaymentWebhook,
  revalidateProducts,
  resolveOrderOrgId,
} from "@prood/commerce"
import type { PaymentWebhookEvent, Order } from "@prood/types"
import { getMailer } from "./mailer"
import type { PaginationParams } from "@prood/commerce"
import type { z } from "zod"
import { checkoutAddressBody } from "./schemas"

type ApiCheckoutAddress = z.infer<typeof checkoutAddressBody>
import type {
  AddToCartInput,
  AdminListParams,
  AdminListOrdersParams,
  CreateCategoryInput,
  CreateProductInput,
  GetCategoriesParams,
  SearchParams,
  UpdateCategoryInput,
  UpdateInventoryInput,
  UpdateProductInput,
  UpdateStoreInput,
  FulfillOrderInput,
} from "@prood/commerce"
import type {
  AdminListOrdersQuery,
  AdminListQuery,
  SearchProductsQuery,
} from "@/lib/schemas"

// ---------------------------------------------------------------------------
// Tenant-scoped service layer shared by Route Handlers and the MCP server.
//
// Storefront functions take an `orgId` and pass it through as the `tenantId`
// argument (the @prood/commerce functions self-scope and tenant-tag caches).
// Admin functions wrap the admin API in `withTenant(orgId)` so RLS applies.
// ---------------------------------------------------------------------------

function toSearchParams(q: SearchProductsQuery): SearchParams {
  return {
    query: q.query,
    categoryId: q.categoryId,
    page: q.page,
    perPage: q.perPage,
    sort: q.sortField
      ? { field: q.sortField, direction: q.sortDirection ?? "asc" }
      : undefined,
  }
}

function toAdminListParams(q: AdminListQuery): AdminListParams {
  return {
    page: q.page,
    perPage: q.perPage,
    search: q.search,
    sort: q.sortField
      ? { field: q.sortField, direction: q.sortDirection ?? "asc" }
      : undefined,
  }
}

function toAdminListOrdersParams(q: AdminListOrdersQuery): AdminListOrdersParams {
  return {
    page: q.page,
    perPage: q.perPage,
    status: q.status,
    customerId: q.customerId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    search: q.search,
  }
}

export const catalog = {
  searchProducts: (orgId: string, q: SearchProductsQuery) =>
    getProducts(toSearchParams(q), orgId),
  getProduct: (orgId: string, id: string) => getProduct({ id }, orgId),
  getProductBySlug: (orgId: string, slug: string) => getProduct({ slug }, orgId),
  listCategories: (orgId: string, params: GetCategoriesParams) =>
    getCategories(params, orgId),
  getStore: (orgId: string) => getStoreInfo(orgId),
  listCountries: () => getCountries(),
}

export const carts = {
  create: (orgId: string) => createCart(orgId),
  get: (orgId: string, id: string) => getCart(id, orgId),
  addItem: (orgId: string, cartId: string, item: AddToCartInput) =>
    addToCart(cartId, item, orgId),
  updateItem: (orgId: string, cartId: string, itemId: string, quantity: number) =>
    updateCartItem(cartId, itemId, quantity, orgId),
  removeItem: (orgId: string, cartId: string, itemId: string) =>
    removeFromCart(cartId, itemId, orgId),
  applyCoupon: (orgId: string, cartId: string, code: string) =>
    applyCoupon(cartId, code, orgId),
  removeCoupon: (orgId: string, cartId: string) => removeCoupon(cartId, orgId),
}

export const checkout = {
  getShippingMethods: (orgId: string, cartId: string) =>
    getShippingMethods(cartId, orgId),
  getPaymentMethods: (orgId: string, cartId: string) =>
    getPaymentMethods(cartId, orgId),
  setShippingAddress: (orgId: string, cartId: string, address: ApiCheckoutAddress) =>
    setShippingAddress(
      cartId,
      address as Parameters<typeof setShippingAddress>[1],
      orgId
    ),
  setBillingAddress: (orgId: string, cartId: string, address: ApiCheckoutAddress) =>
    setBillingAddress(
      cartId,
      address as Parameters<typeof setBillingAddress>[1],
      orgId
    ),
  setShippingMethod: (orgId: string, cartId: string, methodId: string) =>
    setShippingMethod(cartId, methodId, orgId),
  placeOrder: async (orgId: string, cartId: string, customerId?: string) => {
    const order = await placeOrder(cartId, orgId, customerId)
    try {
      revalidateProducts(orgId)
    } catch {
      // Cache invalidation is best-effort; never block the order response
    }
    return order
  },
}

async function resolveOrderEmail(orgId: string, orderId: string): Promise<{ email: string; name: string; order: Order } | null> {
  try {
    const adminApi = await getAdmin()
    const order = await withTenant(orgId, () => adminApi.getOrder(orderId))
    if (!order) return null

    if (order.customerId) {
      const customer = await withTenant(orgId, () => adminApi.getCustomer(order.customerId!))
      if (customer?.email) {
        const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "Customer"
        return { email: customer.email, name, order }
      }
    }

    return null
  } catch {
    return null
  }
}

function resolveOrderIdFromWebhook(event: PaymentWebhookEvent): string | null {
  const data = event.data as Record<string, unknown>
  const object = (data?.data as { object?: Record<string, unknown> })?.object
  const metadata = object?.metadata as Record<string, string> | undefined
  if (metadata?.orderId) return metadata.orderId
  if (typeof data?.orderId === "string") return data.orderId
  if (typeof data?.key === "string") return data.key
  return null
}

export const webhooks = {
  async reconcilePayment(
    provider: string,
    payload: string,
    signature: string,
    orgId?: string
  ): Promise<void> {
    const event = await verifyPaymentWebhook(payload, signature, provider, orgId)
    const orderId = resolveOrderIdFromWebhook(event)
    if (!orderId) return

    const resolvedOrg = orgId ?? (await resolveOrderOrgId(orderId)) ?? undefined
    if (!resolvedOrg) {
      console.error(`[webhook] Cannot resolve org for order ${orderId} — skipping`)
      return
    }

    const apply = async () => {
      const adapter = await getAdapter()
      if (event.type === "payment.captured") {
        await adapter.updateOrderStatus(orderId, { status: "processing" })
        try { revalidateProducts(resolvedOrg) } catch { /* best-effort */ }

        void resolveOrderEmail(resolvedOrg, orderId).then((resolved) => {
          if (!resolved) return
          const { email, name, order } = resolved
          void getMailer().send("email", {
            to: email,
            subject: `Order #${order.orderNumber} confirmed`,
            template: "order-confirmation",
            data: {
              companyName: "Prood",
              customerName: name,
              orderNumber: order.orderNumber,
              orderTotal: `${order.totals.total.currency} ${order.totals.total.amount}`,
              orderUrl: `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/account/orders`,
            },
          })
        })
      } else if (event.type === "payment.failed" || event.type === "payment.cancelled") {
        await adapter.updateOrderStatus(orderId, { status: "cancelled" })

        void resolveOrderEmail(resolvedOrg, orderId).then((resolved) => {
          if (!resolved) return
          const { email, name, order } = resolved
          void getMailer().send("email", {
            to: email,
            subject: `Payment failed for order #${order.orderNumber}`,
            template: "payment-failed",
            data: {
              companyName: "Prood",
              customerName: name,
              orderNumber: order.orderNumber,
              orderTotal: `${order.totals.total.currency} ${order.totals.total.amount}`,
              retryUrl: `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/products`,
            },
          })
        })
      }
    }

    await withTenant(resolvedOrg, apply)
  },
}

export const orders = {
  get: (orgId: string, id: string) => getOrder(id, orgId),
  list: (orgId: string, params?: PaginationParams & { customerId?: string }) =>
    getCustomerOrders(params, orgId),
}

export const admin = {
  listProducts: (orgId: string, q: AdminListQuery) =>
    withTenant(orgId, async () => (await getAdmin()).listProducts(toAdminListParams(q))),
  getProduct: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getProduct(id)),
  createProduct: async (orgId: string, input: CreateProductInput) => {
    const product = await withTenant(orgId, async () => (await getAdmin()).createProduct(input))
    try { revalidateProducts(orgId) } catch { /* best-effort */ }
    return product
  },
  updateProduct: async (orgId: string, id: string, input: UpdateProductInput) => {
    const product = await withTenant(orgId, async () => (await getAdmin()).updateProduct(id, input))
    try { revalidateProducts(orgId) } catch { /* best-effort */ }
    return product
  },
  deleteProduct: async (orgId: string, id: string) => {
    await withTenant(orgId, async () => (await getAdmin()).deleteProduct(id))
    try { revalidateProducts(orgId) } catch { /* best-effort */ }
  },
  createCategory: async (orgId: string, input: CreateCategoryInput) => {
    const category = await withTenant(orgId, async () => (await getAdmin()).createCategory(input))
    try { revalidateProducts(orgId) } catch { /* best-effort */ }
    return category
  },
  updateCategory: async (orgId: string, id: string, input: UpdateCategoryInput) => {
    const category = await withTenant(orgId, async () => (await getAdmin()).updateCategory(id, input))
    try { revalidateProducts(orgId) } catch { /* best-effort */ }
    return category
  },
  deleteCategory: async (orgId: string, id: string) => {
    await withTenant(orgId, async () => (await getAdmin()).deleteCategory(id))
    try { revalidateProducts(orgId) } catch { /* best-effort */ }
  },
  listOrders: (orgId: string, q: AdminListOrdersQuery) =>
    withTenant(orgId, async () =>
      (await getAdmin()).listOrders(toAdminListOrdersParams(q))
    ),
  getOrder: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getOrder(id)),
  fulfillOrder: async (orgId: string, id: string, input: FulfillOrderInput) => {
    await withTenant(orgId, async () => (await getAdmin()).fulfillOrder(id, input))

    void resolveOrderEmail(orgId, id).then((resolved) => {
      if (!resolved) return
      const { email, name, order } = resolved
      void getMailer().send("email", {
        to: email,
        subject: `Order #${order.orderNumber} has shipped`,
        template: "order-shipped",
        data: {
          companyName: "Prood",
          customerName: name,
          orderNumber: order.orderNumber,
          trackingNumber: order.trackingNumber ?? undefined,
          trackingUrl: order.trackingUrl ?? undefined,
          orderUrl: `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/account/orders`,
        },
      })
    })
  },
  refundOrder: async (orgId: string, id: string, note?: string) => {
    await withTenant(orgId, async () => (await getAdmin()).refundOrder(id, note))

    void resolveOrderEmail(orgId, id).then((resolved) => {
      if (!resolved) return
      const { email, name, order } = resolved
      void getMailer().send("email", {
        to: email,
        subject: `Refund for order #${order.orderNumber}`,
        template: "order-refunded",
        data: {
          companyName: "Prood",
          customerName: name,
          orderNumber: order.orderNumber,
          refundAmount: `${order.totals.total.currency} ${order.totals.total.amount}`,
          orderUrl: `${process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000"}/account/orders`,
        },
      })
    })
  },
  listCustomers: (orgId: string, q: AdminListQuery) =>
    withTenant(orgId, async () => (await getAdmin()).listCustomers(toAdminListParams(q))),
  getCustomer: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getCustomer(id)),
  getStoreSettings: (orgId: string) =>
    withTenant(orgId, async () => (await getAdmin()).getStoreSettings()),
  updateStoreSettings: (orgId: string, input: UpdateStoreInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateStoreSettings(input)),
  updateInventory: (orgId: string, input: UpdateInventoryInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateInventory(input)),
  dashboardStats: (orgId: string) =>
    withTenant(orgId, async () => (await getAdmin()).getDashboardStats()),
}
