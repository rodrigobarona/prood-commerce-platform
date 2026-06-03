import 'server-only'
import type {
  Address,
  Cart,
  Coupon,
  Country,
  CreatePaymentSessionInput,
  Order,
  PaginatedResult,
  PaginationParams,
  PaymentMethod,
  PaymentSession,
  Promotion,
  Review,
  ReviewSummary,
  ShippingMethod,
} from '@prood/types'
import { getAdapter, runScoped } from './adapter'
import { getPaymentProvider } from './payments'
import { getTenantPaymentConfig } from './integrations'
import { findOrderOrgId } from '@prood/platform'

type CheckoutAddress = Omit<Address, 'id' | 'isDefault'>

export { priceToMajorAmount } from '@prood/types'

// ---- Shipping & payment options ----

export async function getShippingMethods(
  cartId: string,
  tenantId?: string,
): Promise<ShippingMethod[]> {
  return runScoped(tenantId, async () => (await getAdapter()).getShippingMethods(cartId))
}

export async function getPaymentMethods(
  cartId: string,
  tenantId?: string,
): Promise<PaymentMethod[]> {
  return runScoped(tenantId, async () => (await getAdapter()).getPaymentMethods(cartId))
}

export async function setShippingAddress(
  cartId: string,
  address: CheckoutAddress,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).setShippingAddress(cartId, address),
  )
}

export async function setBillingAddress(
  cartId: string,
  address: CheckoutAddress,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).setBillingAddress(cartId, address),
  )
}

export async function setShippingMethod(
  cartId: string,
  methodId: string,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).setShippingMethod(cartId, methodId),
  )
}

export async function setPaymentMethod(
  cartId: string,
  methodId: string,
  tenantId?: string,
): Promise<Cart> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).setPaymentMethod(cartId, methodId),
  )
}

// ---- Orders ----

export async function placeOrder(
  cartId: string,
  tenantId?: string,
  customerId?: string,
): Promise<Order> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).placeOrder(cartId, customerId ? { customerId } : undefined),
  )
}

export async function getOrder(orderId: string, tenantId?: string): Promise<Order> {
  return runScoped(tenantId, async () => (await getAdapter()).getOrder(orderId))
}

export async function getCustomerOrders(
  params?: PaginationParams & { customerId?: string },
  tenantId?: string,
): Promise<PaginatedResult<Order>> {
  return runScoped(tenantId, async () => (await getAdapter()).getCustomerOrders(params))
}

// ---- Reference data & promotions ----

/** Countries are shared reference data (not tenant-scoped). */
export async function getCountries(): Promise<Country[]> {
  return (await getAdapter()).getCountries()
}

export async function getActivePromotions(tenantId?: string): Promise<Promotion[]> {
  return runScoped(tenantId, async () => (await getAdapter()).getActivePromotions())
}

export async function validateCoupon(code: string, tenantId?: string): Promise<Coupon> {
  return runScoped(tenantId, async () => (await getAdapter()).validateCoupon(code))
}

// ---- Reviews (product detail page) ----

export async function getProductReviews(
  productId: string,
  params?: PaginationParams,
  tenantId?: string,
): Promise<PaginatedResult<Review>> {
  return runScoped(tenantId, async () =>
    (await getAdapter()).getProductReviews(productId, params),
  )
}

export async function getReviewSummary(
  productId: string,
  tenantId?: string,
): Promise<ReviewSummary> {
  return runScoped(tenantId, async () => (await getAdapter()).getReviewSummary(productId))
}

// ---- Payment session (gateway-agnostic) ----

/**
 * Create a payment session with the selected provider.
 * `amount` is in major currency units (see {@link priceToMajorAmount}).
 */
export async function createPaymentSession(
  input: CreatePaymentSessionInput & { providerId?: string; tenantId?: string },
): Promise<PaymentSession> {
  const { providerId, tenantId, ...rest } = input
  const resolvedId = providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? 'stripe'
  const config = tenantId
    ? await getTenantPaymentConfig(tenantId, resolvedId)
    : undefined
  return getPaymentProvider(resolvedId, config).createSession(rest)
}

/** Read a payment session's current status from the provider. */
export async function getPaymentSession(
  sessionId: string,
  providerId?: string,
  tenantId?: string,
): Promise<PaymentSession> {
  const resolvedId = providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? 'stripe'
  const config = tenantId
    ? await getTenantPaymentConfig(tenantId, resolvedId)
    : undefined
  return getPaymentProvider(resolvedId, config).getSession(sessionId)
}

/**
 * Look up the organization that owns an order (cross-tenant, unscoped).
 * Used by the webhook handler to resolve tenant when ?org is missing.
 */
export { findOrderOrgId as resolveOrderOrgId }
