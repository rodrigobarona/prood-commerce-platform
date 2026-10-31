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
  getTenantPaymentProvider,
  revalidateProducts,
  revalidateStore,
} from "@prood/commerce"
import type { CheckoutAddress, PaymentEventInput, PaymentEventResult } from "@prood/types"
import { getStorefrontIdentity } from "@prood/platform"
import { after } from "next/server"
import { getMailer } from "./mailer"
import type { PaginationParams } from "@prood/commerce"
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
  setShippingAddress: (orgId: string, cartId: string, address: CheckoutAddress) =>
    setShippingAddress(cartId, address, orgId),
  setBillingAddress: (orgId: string, cartId: string, address: CheckoutAddress) =>
    setBillingAddress(cartId, address, orgId),
  setShippingMethod: (orgId: string, cartId: string, methodId: string) =>
    setShippingMethod(cartId, methodId, orgId),
  /** Placing an order consumes the cart, so check payment can be taken first. */
  assertPayable: async (orgId: string, cartId: string, providerId?: string) => {
    const cart = await getCart(cartId, orgId)
    if (cart.totals.total.amount > 0) await getTenantPaymentProvider(orgId, providerId)
  },
  placeOrder: async (orgId: string, cartId: string, customerId?: string, contactEmail?: string) => {
    const order = await placeOrder(cartId, orgId, customerId, contactEmail)
    try {
      revalidateProducts(orgId)
    } catch {
      // Cache invalidation is best-effort; never block the order response
    }
    // Nothing to pay means no payment webhook will ever confirm it.
    if (order.totals.total.amount === 0) queueOrderEmail(orgId, order.id, "confirmed")
    return order
  },
}

type PaymentOutcome = PaymentEventInput["outcome"]

const OUTCOME_BY_EVENT: Record<string, PaymentOutcome> = {
  "payment.authorized": "authorized",
  "payment.captured": "captured",
  "payment.failed": "failed",
  "payment.cancelled": "cancelled",
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount)
}

type OrderEmail = "confirmed" | "payment_failed" | "shipped" | "refunded"

/** Email the shopper about their order, branded as the store. Run via `after()`. */
async function sendOrderEmail(orgId: string, orderId: string, kind: OrderEmail) {
  const storefrontUrl = process.env.NEXT_PUBLIC_STOREFRONT_URL
  if (!storefrontUrl) throw new Error("NEXT_PUBLIC_STOREFRONT_URL is required")

  const adminApi = await getAdmin()
  const order = await withTenant(orgId, () => adminApi.getOrder(orderId))
  const customer = order.customerId
    ? await withTenant(orgId, () => adminApi.getCustomer(order.customerId!))
    : null
  if (!customer?.email) return

  const store = await getStorefrontIdentity(orgId, storefrontUrl)
  const base = {
    companyName: store.name,
    customerName: [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "there",
    orderNumber: order.orderNumber,
  }
  const total = formatMoney(order.totals.total.amount, order.totals.total.currency)
  const ordersUrl = `${store.origin}/account/orders`

  const messages: Record<OrderEmail, { subject: string; template: string; data: Record<string, unknown> }> = {
    confirmed: {
      subject: `${store.name}: order #${order.orderNumber} confirmed`,
      template: "order-confirmation",
      data: { ...base, orderTotal: total, orderUrl: ordersUrl },
    },
    payment_failed: {
      subject: `${store.name}: payment for order #${order.orderNumber} didn't go through`,
      template: "payment-failed",
      data: { ...base, orderTotal: total, retryUrl: `${store.origin}/products` },
    },
    shipped: {
      subject: `${store.name}: order #${order.orderNumber} is on its way`,
      template: "order-shipped",
      data: {
        ...base,
        trackingNumber: order.trackingNumber ?? undefined,
        trackingUrl: order.trackingUrl ?? undefined,
        orderUrl: ordersUrl,
      },
    },
    refunded: {
      subject: `${store.name}: refund for order #${order.orderNumber}`,
      template: "order-refunded",
      data: { ...base, refundAmount: total, orderUrl: ordersUrl },
    },
  }

  const message = messages[kind]
  await getMailer().send("email", { to: customer.email, ...message })
}

/** Queue an order email to send after the response, logging failures. */
function queueOrderEmail(orgId: string, orderId: string, kind: OrderEmail) {
  after(() =>
    sendOrderEmail(orgId, orderId, kind).catch((err) =>
      console.error(`[email] ${kind} email for order ${orderId} failed`, err)
    )
  )
}

export const webhooks = {
  /**
   * Verify a gateway webhook with the store's own credentials and apply it to
   * the order. Replays and out-of-order events are no-ops; captures whose
   * amount or currency differs from the order total are recorded, not applied.
   */
  async reconcilePayment(
    provider: string,
    payload: string,
    signature: string,
    orgId: string
  ): Promise<PaymentEventResult | "ignored"> {
    const event = await verifyPaymentWebhook(payload, signature, provider, orgId)
    const outcome = OUTCOME_BY_EVENT[event.type]
    if (!outcome || !event.orderId) return "ignored"
    const orderId = event.orderId

    const result = await withTenant(orgId, async () =>
      (await getAdapter()).applyPaymentEvent(orderId, {
        outcome,
        amount: event.amount,
        currency: event.currency,
        provider,
      })
    )

    if (result === "amount_mismatch") {
      console.error(
        `[webhook] ${provider} amount mismatch for order ${orderId}: ${event.amount} ${event.currency}`
      )
    }
    if (result === "order_cancelled") {
      console.error(`[webhook] ${provider} reported a payment on cancelled order ${orderId}`)
    }
    if (result !== "applied") return result

    revalidateProducts(orgId)
    if (outcome === "captured") queueOrderEmail(orgId, orderId, "confirmed")
    if (outcome === "failed") queueOrderEmail(orgId, orderId, "payment_failed")
    return result
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

    queueOrderEmail(orgId, id, "shipped")
  },
  refundOrder: async (orgId: string, id: string, note?: string) => {
    await withTenant(orgId, async () => (await getAdmin()).refundOrder(id, note))

    queueOrderEmail(orgId, id, "refunded")
  },
  cancelOrder: async (orgId: string, id: string, note?: string) => {
    await withTenant(orgId, async () => {
      const adapter = await getAdapter()
      await adapter.cancelOrder(id, note)
    })
  },
  getOrderHistory: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdapter()).getOrderHistory(id)),
  listCustomers: (orgId: string, q: AdminListQuery) =>
    withTenant(orgId, async () => (await getAdmin()).listCustomers(toAdminListParams(q))),
  getCustomer: (orgId: string, id: string) =>
    withTenant(orgId, async () => (await getAdmin()).getCustomer(id)),
  getStoreSettings: (orgId: string) =>
    withTenant(orgId, async () => (await getAdmin()).getStoreSettings()),
  updateStoreSettings: async (orgId: string, input: UpdateStoreInput) => {
    const settings = await withTenant(orgId, async () => (await getAdmin()).updateStoreSettings(input))
    revalidateStore(orgId)
    return settings
  },
  updateInventory: (orgId: string, input: UpdateInventoryInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateInventory(input)),
  dashboardStats: (orgId: string) =>
    withTenant(orgId, async () => (await getAdmin()).getDashboardStats()),
}
