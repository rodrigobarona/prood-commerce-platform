import { z } from "zod"
import type { DashboardStats, StoreSettings } from "@prood/commerce"
import type {
  Address,
  Attribute,
  Cart,
  CartItem,
  CartTotals,
  Category,
  CheckoutAddress,
  CommerceErrorBody,
  Country,
  Customer,
  DiscountablePrice,
  Facet,
  FacetValue,
  FulfillmentStatus,
  FulfillmentType,
  Image,
  Installment,
  Order,
  OrderFulfillmentStatus,
  OrderHistoryEntry,
  OrderItem,
  OrderPaymentDetails,
  OrderStatus,
  PaginatedResult,
  PaymentEventResult,
  PaymentMethod,
  PaymentStatus,
  Price,
  Product,
  ProductType,
  ProductVariant,
  SearchResult,
  ShippingMethod,
  StoreCurrency,
  StoreInfo,
  StoreLocale,
} from "@prood/types"
import type { ApiCaller } from "./auth-tenant"

// ---------------------------------------------------------------------------
// Response bodies of the REST API. Each schema `satisfies` its domain type and
// `ExactSchemas` below rejects anything extra, so these schemas, the generated
// OpenAPI document and the API client types cannot drift from `@prood/types`.
// ---------------------------------------------------------------------------

const localizedField = z.record(z.string(), z.string())
const nullableString = z.string().nullable()

const price = z.object({
  amount: z.number(),
  currency: z.string(),
  formatted: z.string(),
}) satisfies z.ZodType<Price>

const discountablePrice = price.extend({
  originalAmount: z.number().optional(),
  discountPercent: z.number().optional(),
}) satisfies z.ZodType<DiscountablePrice>

const image = z.object({
  url: z.string(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
}) satisfies z.ZodType<Image>

const address = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phone: nullableString,
  street: z.string(),
  street2: nullableString,
  city: z.string(),
  state: nullableString,
  country: z.string(),
  postalCode: nullableString,
  isDefault: z.boolean(),
}) satisfies z.ZodType<Address>

const checkoutAddress = z.object({
  firstName: z.string(),
  lastName: z.string(),
  phone: nullableString.optional(),
  street: z.string(),
  street2: nullableString.optional(),
  city: z.string(),
  state: nullableString.optional(),
  country: z.string(),
  postalCode: nullableString.optional(),
}) satisfies z.ZodType<CheckoutAddress>

export const errorBody = z.object({
  code: z.string(),
  message: z.string(),
  errors: z
    .array(z.object({ path: z.string(), message: z.string() }))
    .optional(),
}) satisfies z.ZodType<CommerceErrorBody>

export const successBody = z.object({ success: z.literal(true) })
export const healthBody = z.object({ status: z.literal("ok") })

export const webhookAcceptedBody = z.object({
  received: z.literal(true),
  result: z.enum(["applied", "duplicate", "amount_mismatch", "order_cancelled", "ignored"]),
}) satisfies z.ZodType<{ received: true; result: PaymentEventResult | "ignored" }>

export const callerBody = z.object({
  organizationId: z.string(),
  scopes: z.array(z.enum(["storefront", "admin"])),
  via: z.enum(["api-key", "session", "host", "agent"]),
}) satisfies z.ZodType<Pick<ApiCaller, "scopes" | "via"> & { organizationId: string }>

export function paginated<T>(item: z.ZodType<T>) {
  return z.object({
    items: z.array(item),
    total: z.number(),
    page: z.number(),
    perPage: z.number(),
    hasMore: z.boolean(),
  }) satisfies z.ZodType<PaginatedResult<T>>
}

export const category = z.object({
  id: z.string(),
  name: localizedField,
  slug: z.string(),
  description: localizedField.nullable(),
  image: image.nullable(),
  parentId: nullableString,
  productCount: z.number().nullable(),
}) satisfies z.ZodType<Category>

const attribute = z.object({
  code: z.string(),
  name: localizedField,
  value: localizedField,
}) satisfies z.ZodType<Attribute>

const productVariant = z.object({
  id: z.string(),
  sku: nullableString,
  name: localizedField.nullable(),
  price: discountablePrice.nullable(),
  inStock: z.boolean(),
  inventoryQuantity: z.number().nullable(),
}) satisfies z.ZodType<ProductVariant>

const productType = z.enum([
  "physical",
  "digital",
  "service",
  "event",
  "subscription",
]) satisfies z.ZodType<ProductType>

export const product = z.object({
  id: z.string(),
  sku: nullableString,
  name: localizedField,
  slug: z.string(),
  description: localizedField.nullable(),
  shortDescription: localizedField.nullable(),
  price: discountablePrice.nullable(),
  primaryImage: image.nullable(),
  gallery: z.array(image),
  rating: z.object({ average: z.number(), count: z.number() }).nullable(),
  variants: z.array(productVariant),
  attributes: z.array(attribute),
  quantityLimit: z.number().nullable(),
  categories: z.array(category),
  inStock: z.boolean(),
  vatIncluded: z.boolean(),
  vatRate: z.number().nullable(),
  tags: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  productType,
  requiresShipping: z.boolean(),
  isDropshipped: z.boolean(),
  status: nullableString,
}) satisfies z.ZodType<Product>

const facetValue = z.object({
  label: localizedField,
  value: z.string(),
  count: z.number(),
  selected: z.boolean(),
}) satisfies z.ZodType<FacetValue>

const facet = z.object({
  name: localizedField,
  code: z.string(),
  values: z.array(facetValue),
}) satisfies z.ZodType<Facet>

export const searchResult = z.object({
  products: paginated(product),
  facets: z.array(facet),
  suggestions: z.array(z.string()).nullable(),
}) satisfies z.ZodType<SearchResult>

const cartItem = z.object({
  id: z.string(),
  productId: z.string(),
  productSlug: z.string().optional(),
  variantId: nullableString,
  name: localizedField,
  variantName: localizedField.optional(),
  image: image.nullable(),
  quantity: z.number(),
  price: discountablePrice,
  totalPrice: price,
}) satisfies z.ZodType<CartItem>

const cartTotals = z.object({
  subtotal: price,
  shipping: price.nullable(),
  tax: price.nullable(),
  discount: price.nullable(),
  total: price,
}) satisfies z.ZodType<CartTotals>

const fulfillmentType = z.enum([
  "shipping",
  "local_delivery",
  "pickup",
]) satisfies z.ZodType<FulfillmentType>

export const shippingMethod = z.object({
  id: z.string(),
  name: localizedField,
  provider: z.string(),
  fulfillmentType,
  estimatedDays: z.object({ min: z.number(), max: z.number() }),
  price,
  cashOnDelivery: z.boolean(),
}) satisfies z.ZodType<ShippingMethod>

const installment = z.object({
  count: z.number(),
  amount: z.number(),
  currency: z.string(),
}) satisfies z.ZodType<Installment>

export const paymentMethod = z.object({
  id: z.string(),
  type: z.string(),
  name: localizedField,
  provider: z.string(),
  installments: installment.nullable(),
  icon: nullableString,
}) satisfies z.ZodType<PaymentMethod>

export const cart = z.object({
  id: z.string(),
  items: z.array(cartItem),
  totals: cartTotals,
  shippingAddress: checkoutAddress.nullable(),
  billingAddress: checkoutAddress.nullable(),
  shippingMethod: shippingMethod.nullable(),
  paymentMethod: paymentMethod.nullable(),
  couponCode: nullableString,
  couponError: nullableString,
  requiresShipping: z.boolean(),
  customerId: nullableString,
  itemCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<Cart>

const orderStatus = z.enum([
  "placed",
  "approved",
  "fulfilled",
  "cancelled",
]) satisfies z.ZodType<OrderStatus>

const paymentStatus = z.enum([
  "unpaid",
  "authorized",
  "paid",
  "partially_refunded",
  "refunded",
  "voided",
  "free",
]) satisfies z.ZodType<PaymentStatus>

const orderFulfillmentStatus = z.enum([
  "unfulfilled",
  "in_progress",
  "fulfilled",
  "not_required",
]) satisfies z.ZodType<OrderFulfillmentStatus>

const fulfillmentStatus = z.enum([
  "unfulfilled",
  "partially_fulfilled",
  "fulfilled",
  "returned",
  "download_ready",
  "license_sent",
  "access_granted",
  "ticket_issued",
]) satisfies z.ZodType<FulfillmentStatus>

const orderItem = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: nullableString,
  name: localizedField,
  variantName: localizedField.nullable(),
  image: image.nullable(),
  quantity: z.number(),
  price,
  totalPrice: price,
  fulfillmentStatus,
  productType,
}) satisfies z.ZodType<OrderItem>

const orderPaymentDetails = z.object({
  method: z.enum(["card", "multibanco", "mbway"]),
  entity: nullableString,
  reference: nullableString,
  expiresAt: nullableString,
}) satisfies z.ZodType<OrderPaymentDetails>

export const order = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: orderStatus,
  paymentStatus,
  fulfillmentStatus: orderFulfillmentStatus,
  items: z.array(orderItem),
  totals: cartTotals,
  shippingAddress: checkoutAddress.nullable(),
  billingAddress: checkoutAddress.nullable(),
  shippingMethod: shippingMethod.nullable(),
  paymentMethod: paymentMethod.nullable(),
  paymentProvider: nullableString,
  paymentTransactionId: nullableString,
  paymentDetails: orderPaymentDetails.nullable(),
  couponCode: nullableString,
  trackingNumber: nullableString,
  trackingUrl: nullableString,
  note: nullableString,
  customerId: nullableString,
  contactEmail: nullableString,
  requiresShipping: z.boolean(),
  placedAt: nullableString,
  approvedAt: nullableString,
  cancelledAt: nullableString,
  fulfilledAt: nullableString,
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<Order>

/** An order as its merchant sees it, with how it can be refunded. */
export const adminOrder = order.extend({
  refund: z
    .enum(["provider", "manual"])
    .nullable()
    .describe(
      "`provider`: Prood sends the refund. `manual`: refund in the payment account, then record it with `recordOnly`. Null when nothing can be refunded."
    ),
})

export const orderHistoryEntry = z.object({
  id: z.string(),
  orderId: z.string(),
  action: z.string(),
  note: nullableString,
  createdAt: z.string(),
}) satisfies z.ZodType<OrderHistoryEntry>

export const customer = z.object({
  id: z.string(),
  email: nullableString,
  firstName: nullableString,
  lastName: nullableString,
  phone: nullableString,
  addresses: z.array(address),
  defaultAddressId: nullableString,
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<Customer>

const storeCurrency = z.object({
  code: z.string(),
  symbol: z.string(),
  isDefault: z.boolean(),
}) satisfies z.ZodType<StoreCurrency>

const storeLocale = z.object({
  code: z.string(),
  name: z.string(),
  direction: z.enum(["ltr", "rtl"]),
  isDefault: z.boolean(),
}) satisfies z.ZodType<StoreLocale>

export const storeInfo = z.object({
  name: localizedField,
  description: localizedField.nullable(),
  logo: image.nullable(),
  currencies: z.array(storeCurrency),
  locales: z.array(storeLocale),
  country: z.string(),
}) satisfies z.ZodType<StoreInfo>

export const country = z.object({
  id: z.string(),
  code: z.string(),
  iso3: nullableString,
  name: localizedField,
  flag: nullableString,
  callingCode: nullableString,
  currency: nullableString,
  capital: nullableString,
}) satisfies z.ZodType<Country>

export const adminStoreSettings = z.object({
  name: localizedField,
  description: localizedField.nullable(),
  logo: nullableString,
  favicon: nullableString,
  currency: z.string(),
  locale: z.string(),
  timezone: z.string(),
  country: z.string(),
  supportedCurrencies: z.array(z.string()),
  supportedLocales: z.array(z.string()),
  contactEmail: nullableString,
  contactPhone: nullableString,
  address: nullableString,
  socialLinks: z.record(z.string(), z.string()).nullable(),
  currencyLocked: z.boolean(),
}) satisfies z.ZodType<StoreSettings>

export const adminDashboardStats = z.object({
  totalProducts: z.number(),
  activeProducts: z.number(),
  totalOrders: z.number(),
  totalRevenue: z.number(),
  totalCustomers: z.number(),
  recentOrders: z.array(order),
  ordersByStatus: z.record(z.string(), z.number()),
}) satisfies z.ZodType<DashboardStats>

// `satisfies` only proves a schema is assignable to its domain type: a schema
// that gains a field, or drops an optional one, still passes. Identity checks
// the other direction too, and covers the schemas nested in these ones.
type Identical<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false
type Exact<Schema extends z.ZodType, Domain> = Identical<z.output<Schema>, Domain>
type Check<T extends true> = T

export type ExactSchemas = [
  Check<Exact<typeof errorBody, CommerceErrorBody>>,
  Check<Exact<typeof category, Category>>,
  Check<Exact<typeof product, Product>>,
  Check<Exact<typeof searchResult, SearchResult>>,
  Check<Exact<typeof cart, Cart>>,
  Check<Exact<typeof shippingMethod, ShippingMethod>>,
  Check<Exact<typeof paymentMethod, PaymentMethod>>,
  Check<Exact<typeof order, Order>>,
  Check<Exact<typeof orderHistoryEntry, OrderHistoryEntry>>,
  Check<Exact<typeof customer, Customer>>,
  Check<Exact<typeof storeInfo, StoreInfo>>,
  Check<Exact<typeof country, Country>>,
  Check<Exact<typeof adminStoreSettings, StoreSettings>>,
  Check<Exact<typeof adminDashboardStats, DashboardStats>>,
]
