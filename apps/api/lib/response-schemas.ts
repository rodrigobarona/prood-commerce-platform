import { z } from "zod"

const localizedField = z.record(z.string(), z.string())
const nullableString = z.string().nullable()

const price = z
  .object({
    amount: z.number(),
    currency: z.string(),
    formatted: z.string(),
  })
  .catchall(z.unknown())

const image = z
  .object({
    url: z.string(),
    alt: z.string(),
    width: z.number().optional(),
    height: z.number().optional(),
  })
  .catchall(z.unknown())

const address = z
  .object({
    id: z.string().optional(),
    firstName: z.string(),
    lastName: z.string(),
    phone: nullableString.optional(),
    street: z.string(),
    street2: nullableString.optional(),
    city: z.string(),
    state: nullableString.optional(),
    country: z.string(),
    postalCode: nullableString.optional(),
    district: nullableString.optional(),
    nationalAddress: nullableString.optional(),
    additionalNumber: nullableString.optional(),
    isDefault: z.boolean().optional(),
  })
  .catchall(z.unknown())

export const errorBody = z.object({
  code: z.string(),
  message: z.string(),
  errors: z
    .array(z.object({ path: z.string(), message: z.string() }))
    .optional(),
})

export const successBody = z.object({ success: z.literal(true) })
export const healthBody = z.object({ status: z.literal("ok") })
export const webhookAcceptedBody = z.object({ received: z.literal(true) })

export const callerBody = z.object({
  organizationId: z.string(),
  scopes: z.array(z.enum(["storefront", "admin"])),
  via: z.enum(["api-key", "session", "host", "agent"]),
})

export function paginated<T extends z.ZodType>(item: T) {
  return z
    .object({
      items: z.array(item),
      total: z.number(),
      page: z.number().optional(),
      perPage: z.number().optional(),
      hasMore: z.boolean().optional(),
    })
    .catchall(z.unknown())
}

export const category = z
  .object({
    id: z.string(),
    name: localizedField,
    slug: z.string(),
    description: localizedField.nullable().optional(),
    image: image.nullable().optional(),
    parentId: z.string().nullable().optional(),
    children: z.array(z.record(z.string(), z.unknown())).optional(),
    productCount: z.number().nullable().optional(),
  })
  .catchall(z.unknown())

export const product = z
  .object({
    id: z.string(),
    sku: nullableString.optional(),
    name: localizedField,
    slug: z.string(),
    description: localizedField.nullable().optional(),
    shortDescription: localizedField.nullable().optional(),
    price: price.nullable().optional(),
    primaryImage: image.nullable().optional(),
    gallery: z.array(image).optional(),
    variants: z.array(z.record(z.string(), z.unknown())).optional(),
    options: z.array(z.record(z.string(), z.unknown())).optional(),
    attributes: z.array(z.record(z.string(), z.unknown())).optional(),
    categories: z.array(category).optional(),
    inStock: z.boolean(),
    tags: z.array(z.string()).optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    productType: z.string().optional(),
    status: z.string().nullable().optional(),
  })
  .catchall(z.unknown())

export const searchResult = z
  .object({
    products: paginated(product),
    facets: z.array(z.record(z.string(), z.unknown())),
    suggestions: z.array(z.string()).nullable().optional(),
  })
  .catchall(z.unknown())

const cartItem = z
  .object({
    id: z.string(),
    productId: z.string(),
    productSlug: z.string().optional(),
    variantId: z.string().nullable().optional(),
    name: localizedField,
    quantity: z.number(),
    price,
    totalPrice: price,
  })
  .catchall(z.unknown())

const cartTotals = z
  .object({
    subtotal: price,
    shipping: price.nullable().optional(),
    tax: price.nullable().optional(),
    discount: price.nullable().optional(),
    total: price,
  })
  .catchall(z.unknown())

export const shippingMethod = z
  .object({
    id: z.string(),
    name: localizedField,
    provider: z.string(),
    fulfillmentType: z.string(),
    estimatedDays: z.object({ min: z.number(), max: z.number() }).catchall(z.unknown()),
    estimatedMinutes: z.number().optional(),
    price,
    cashOnDelivery: z.boolean(),
  })
  .catchall(z.unknown())

export const paymentMethod = z
  .object({
    id: z.string(),
    type: z.string(),
    name: localizedField,
    provider: z.string(),
    installments: z.record(z.string(), z.unknown()).nullable().optional(),
    icon: z.string().nullable().optional(),
  })
  .catchall(z.unknown())

export const cart = z
  .object({
    id: z.string(),
    items: z.array(cartItem),
    totals: cartTotals,
    shippingAddress: address.nullable().optional(),
    billingAddress: address.nullable().optional(),
    shippingMethod: shippingMethod.nullable().optional(),
    paymentMethod: paymentMethod.nullable().optional(),
    couponCode: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
    itemCount: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .catchall(z.unknown())

export const order = z
  .object({
    id: z.string(),
    orderNumber: z.string(),
    status: z.string(),
    paymentStatus: z.string(),
    fulfillmentStatus: z.string(),
    items: z.array(z.record(z.string(), z.unknown())),
    totals: cartTotals,
    shippingAddress: address.nullable().optional(),
    billingAddress: address.nullable().optional(),
    shippingMethod: shippingMethod.nullable().optional(),
    paymentMethod: paymentMethod.nullable().optional(),
    trackingNumber: z.string().nullable().optional(),
    trackingUrl: z.string().nullable().optional(),
    note: z.string().nullable().optional(),
    customerId: z.string().nullable().optional(),
    contactEmail: z.string().nullable().optional(),
    requiresShipping: z.boolean().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .catchall(z.unknown())

export const orderHistoryEntry = z
  .object({
    id: z.string(),
    orderId: z.string(),
    action: z.string(),
    note: z.string().nullable().optional(),
    createdAt: z.string(),
  })
  .catchall(z.unknown())

export const customer = z
  .object({
    id: z.string(),
    email: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    addresses: z.array(address).optional(),
    defaultAddressId: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .catchall(z.unknown())

export const storeInfo = z
  .object({
    name: localizedField,
    description: localizedField.nullable().optional(),
    logo: image.nullable().optional(),
    currencies: z.array(z.record(z.string(), z.unknown())),
    locales: z.array(z.record(z.string(), z.unknown())),
    country: z.string(),
  })
  .catchall(z.unknown())

export const country = z
  .object({
    id: z.string(),
    code: z.string(),
    iso3: z.string().nullable().optional(),
    name: localizedField,
    flag: z.string().nullable().optional(),
    callingCode: z.string().nullable().optional(),
    currency: z.string().nullable().optional(),
    capital: z.string().nullable().optional(),
  })
  .catchall(z.unknown())

export const adminStoreSettings = z.record(z.string(), z.unknown())
export const adminDashboardStats = z.record(z.string(), z.unknown())

