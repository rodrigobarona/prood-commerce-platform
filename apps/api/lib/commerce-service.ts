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
  resolveCustomerId,
  listTenantPaymentProviders,
  revalidateProducts,
  revalidateStore,
} from "@prood/commerce"
import {
  CommerceError,
  isCommerceError,
  requiredEnv,
  type CheckoutAddress,
  type Order,
  type PaymentEventInput,
  type PaymentEventResult,
  type PaymentProvider,
  type StorefrontStore,
} from "@prood/types"
import { getStorefrontIdentity } from "@prood/platform"
import { after } from "next/server"
import { getMailer } from "./mailer"
import { isOrderEmail, publicOrder } from "./order-view"
import { hasScope } from "./scopes"
import type { ApiCaller } from "./auth-tenant"
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
    awaitingPaymentFrom: q.awaitingPaymentFrom,
  }
}

/**
 * Read live rather than with the cached store info, so connecting a provider
 * counts at once. Must stay outside `withTenant`: `prood_app` can't read
 * `integration_config`.
 *
 * Fails open: this only decides what to display, so losing it mustn't take the
 * store or the dashboard down with it. Nothing unpaid slips through, because
 * `checkout.assertPayable` refuses a paid order by itself, and a store shown
 * as closed by mistake would lose real sales.
 */
async function canTakeOrders(orgId: string): Promise<boolean> {
  try {
    return (await listTenantPaymentProviders(orgId)).length > 0
  } catch (err) {
    console.error("[api] couldn't read payment providers", err)
    return true
  }
}

function storefrontUrl(): string {
  return requiredEnv(process.env.NEXT_PUBLIC_STOREFRONT_URL, "NEXT_PUBLIC_STOREFRONT_URL")
}

export const catalog = {
  searchProducts: (orgId: string, q: SearchProductsQuery) =>
    getProducts(toSearchParams(q), orgId),
  getProduct: (orgId: string, id: string) => getProduct({ id }, orgId),
  getProductBySlug: (orgId: string, slug: string) => getProduct({ slug }, orgId),
  listCategories: (orgId: string, params: GetCategoriesParams) =>
    getCategories(params, orgId),
  getStore: async (orgId: string): Promise<StorefrontStore> => {
    const [store, payable] = await Promise.all([getStoreInfo(orgId), canTakeOrders(orgId)])
    return { ...store, canTakeOrders: payable }
  },
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
  /**
   * Placing an order consumes the cart, so check payment can be taken first. A
   * store with nothing connected is unavailable; naming a provider it doesn't
   * have is the caller's mistake, and stays a 422.
   */
  assertPayable: async (orgId: string, cartId: string, providerId?: string) => {
    const cart = await getCart(cartId, orgId)
    if (cart.totals.total.amount <= 0) return
    try {
      await getTenantPaymentProvider(orgId, providerId)
    } catch (err) {
      if (!providerId && isCommerceError(err) && err.code === "VALIDATION") {
        throw new CommerceError(err.message, "ORDERS_UNAVAILABLE")
      }
      throw err
    }
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
  "payment.refunded": "refunded",
  "payment.partially_refunded": "partially_refunded",
}

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount)
}

type OrderEmail = "confirmed" | "payment_failed" | "shipped" | "refunded" | "partially_refunded"

/** What a partial refund's email reports. Gateways that don't name refunds give a running total. */
interface PartialRefund {
  amount: number | null
  runningTotal: boolean
}

/** Email the shopper about their order, branded as the store. Run via `after()`. */
async function sendOrderEmail(orgId: string, orderId: string, kind: OrderEmail, refund?: PartialRefund) {
  const adminApi = await getAdmin()
  const order = await withTenant(orgId, () => adminApi.getOrder(orderId))
  const customer = order.customerId
    ? await withTenant(orgId, () => adminApi.getCustomer(order.customerId!))
    : null
  // Guests have no customer record, only the email they gave at checkout.
  const email = customer?.email ?? order.contactEmail
  if (!email) return

  const store = await getStorefrontIdentity(orgId, storefrontUrl())
  const base = {
    companyName: store.name,
    customerName: [customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "there",
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
    partially_refunded: {
      subject: `${store.name}: partial refund for order #${order.orderNumber}`,
      template: "order-refunded",
      data: {
        ...base,
        refundAmount: refund?.amount == null ? "Part of your order" : formatMoney(refund.amount, order.totals.total.currency),
        refundAmountLabel: refund?.runningTotal ? "Refunded so far" : "Refund amount",
        orderUrl: ordersUrl,
      },
    },
  }

  const message = messages[kind]
  await getMailer().send("email", { to: email, ...message })
}

/** Queue an order email to send after the response, logging failures. */
function queueOrderEmail(orgId: string, orderId: string, kind: OrderEmail, refund?: PartialRefund) {
  after(() =>
    sendOrderEmail(orgId, orderId, kind, refund).catch((err) =>
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
        transactionId: event.sessionId || null,
        method: event.method ?? null,
        refundId: event.refundId ?? null,
      })
    )

    // An error makes the provider redeliver it, by when the capture should be in.
    if (result === "refund_before_capture") {
      throw new CommerceError(`Order ${orderId} isn't paid yet, so its refund can't apply.`, "VALIDATION", 409)
    }
    if (result === "amount_mismatch") {
      console.error(
        `[webhook] ${provider} amount mismatch for order ${orderId}: ${event.amount} ${event.currency}`
      )
    }
    if (result === "order_cancelled") {
      console.error(`[webhook] ${provider} reported a payment on cancelled order ${orderId}`)
    }
    if (result === "second_payment") {
      console.error(`[webhook] ${provider} reported a second payment on order ${orderId}`)
    }
    if (result !== "applied" && result !== "refund_completed") return result

    revalidateProducts(orgId)
    if (outcome === "captured") queueOrderEmail(orgId, orderId, "confirmed")
    if (outcome === "failed") queueOrderEmail(orgId, orderId, "payment_failed")
    if (outcome === "refunded" || result === "refund_completed") {
      queueOrderEmail(orgId, orderId, "refunded")
    } else if (outcome === "partially_refunded") {
      queueOrderEmail(orgId, orderId, "partially_refunded", {
        amount: event.amount,
        runningTotal: !event.refundId,
      })
    }
    return result
  },
}

export const orders = {
  /**
   * Staff and the customer who placed it see everything; anyone else, the public
   * view. Capabilities are per operation, so an agent needs `adminGetOrder`.
   */
  getForCaller: async (caller: ApiCaller, id: string, email?: string) => {
    const order = await getOrder(id, caller.orgId)
    const isStaff = caller.capabilities
      ? caller.capabilities.includes("adminGetOrder")
      : hasScope(caller.scopes, "staff")
    if (isStaff) return order
    if (caller.userId && order.customerId) {
      const customerId = await resolveCustomerId(caller.orgId, caller.userId)
      if (customerId === order.customerId) return order
    }
    return publicOrder(order, isOrderEmail(order, email))
  },
  list: (orgId: string, params?: PaginationParams & { customerId?: string }) =>
    getCustomerOrders(params, orgId),
}

/** How an order can be refunded: by Prood, by hand in the payment account, or not at all. */
export type RefundOption = "provider" | "manual" | null

/** The connected provider that can send this order's refund, if there is one. */
async function refundProvider(orgId: string, order: Order): Promise<PaymentProvider | null> {
  const method = order.paymentDetails?.method
  if (!order.paymentProvider || !order.paymentTransactionId || !method) return null
  try {
    const { provider } = await getTenantPaymentProvider(orgId, order.paymentProvider)
    return provider.refund && provider.refundableMethods.includes(method) ? provider : null
  } catch (err) {
    // The store disconnected the provider, so the refund has to happen over there.
    if (isCommerceError(err)) return null
    throw err
  }
}

async function refundOption(orgId: string, order: Order): Promise<RefundOption> {
  if (order.paymentStatus !== "paid") return null
  return (await refundProvider(orgId, order)) ? "provider" : "manual"
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
  getOrder: async (orgId: string, id: string) => {
    const order = await withTenant(orgId, async () => (await getAdmin()).getOrder(id))
    return { ...order, refund: await refundOption(orgId, order) }
  },
  fulfillOrder: async (orgId: string, id: string, input: FulfillOrderInput) => {
    await withTenant(orgId, async () => (await getAdmin()).fulfillOrder(id, input))

    queueOrderEmail(orgId, id, "shipped")
  },
  /**
   * Refund an order and tell the shopper, in that order: nothing is recorded or
   * sent until the money has moved. A refund made in the payment account, which
   * is the only way where Prood can't send it, is confirmed with `recordOnly`.
   */
  refundOrder: async (orgId: string, id: string, input: { note?: string; recordOnly?: boolean }) => {
    const adminApi = await getAdmin()
    const order = await withTenant(orgId, () => adminApi.getOrder(id))
    if (order.paymentStatus !== "paid") {
      throw new CommerceError("Only paid orders can be refunded.", "VALIDATION", 422)
    }

    const { amount, currency } = order.totals.total
    const provider = input.recordOnly ? null : await refundProvider(orgId, order)
    if (!provider && !input.recordOnly) {
      throw new CommerceError(
        `Prood can't send this refund. Refund ${formatMoney(amount, currency)} in your payment account first, then record it here.`,
        "VALIDATION",
        422
      )
    }

    // The checks above run outside any transaction: a provider call must not hold one.
    try {
      await provider?.refund?.({
        sessionId: order.paymentTransactionId!,
        amount,
        idempotencyKey: `refund-${id}`,
      })
    } catch (err) {
      console.error(`[refund] ${provider?.id} refused the refund for order ${id}`, err)
      throw new CommerceError(
        `We couldn't send this refund through ${provider?.name}. Nothing was recorded. Check your ${provider?.name} account, then try again.`,
        "PLATFORM_ERROR"
      )
    }

    try {
      await withTenant(orgId, () => adminApi.recordRefund(id, input.note))
    } catch (err) {
      if (!provider) throw err
      // The provider's webhook can get there first, and it tells the shopper.
      const current = await withTenant(orgId, () => adminApi.getOrder(id)).catch(() => null)
      if (current?.paymentStatus === "refunded") return
      console.error(`[refund] ${provider.id} refunded order ${id} but recording it failed`, err)
      throw new CommerceError(
        `${formatMoney(amount, currency)} went back to the customer, but we couldn't record it. Don't send it again.`,
        "PLATFORM_ERROR"
      )
    }

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
  getStoreSettings: async (orgId: string) => {
    const settings = await withTenant(orgId, async () => (await getAdmin()).getStoreSettings())
    // The address is only for display, so it can't take the settings down with it.
    const url = await getStorefrontIdentity(orgId, storefrontUrl())
      .then((store) => store.origin)
      .catch((err: unknown) => {
        console.error(`[store] no address for ${orgId}`, err)
        return null
      })
    return { ...settings, url }
  },
  updateStoreSettings: async (orgId: string, input: UpdateStoreInput) => {
    const settings = await withTenant(orgId, async () =>
      (await getAdmin()).updateStoreSettings(input),
    )
    try { revalidateStore(orgId) } catch { /* best-effort */ }
    return settings
  },
  updateInventory: (orgId: string, input: UpdateInventoryInput) =>
    withTenant(orgId, async () => (await getAdmin()).updateInventory(input)),
  dashboardStats: async (orgId: string) => {
    const [stats, payable] = await Promise.all([
      withTenant(orgId, async () => (await getAdmin()).getDashboardStats()),
      canTakeOrders(orgId),
    ])
    return { ...stats, canTakeOrders: payable }
  },
}
