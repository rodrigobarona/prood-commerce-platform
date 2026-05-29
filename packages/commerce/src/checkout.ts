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
  Price,
  Promotion,
  Review,
  ReviewSummary,
  ShippingMethod,
} from '@commercejs/types'
import { getAdapter, runScoped } from './adapter'
import { getPaymentProvider } from './payments'

type CheckoutAddress = Omit<Address, 'id' | 'isDefault'>

/** Currencies whose smallest unit equals the major unit (no division). */
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

/**
 * Convert a {@link Price} (amount in the smallest currency unit) to the major
 * unit expected by the {@link PaymentProvider} contract (e.g. 4990 -> 49.90).
 */
export function priceToMajorAmount(price: Price): number {
  return ZERO_DECIMAL_CURRENCIES.has(price.currency.toUpperCase())
    ? price.amount
    : price.amount / 100
}

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

export async function placeOrder(cartId: string, tenantId?: string): Promise<Order> {
  return runScoped(tenantId, async () => (await getAdapter()).placeOrder(cartId))
}

export async function getOrder(orderId: string, tenantId?: string): Promise<Order> {
  return runScoped(tenantId, async () => (await getAdapter()).getOrder(orderId))
}

export async function getCustomerOrders(
  params?: PaginationParams,
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
  input: CreatePaymentSessionInput & { providerId?: string },
): Promise<PaymentSession> {
  const { providerId, ...rest } = input
  return getPaymentProvider(providerId).createSession(rest)
}

/** Read a payment session's current status from the provider. */
export async function getPaymentSession(
  sessionId: string,
  providerId?: string,
): Promise<PaymentSession> {
  return getPaymentProvider(providerId).getSession(sessionId)
}
