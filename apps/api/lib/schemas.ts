import { DEFAULT_LOCALES } from "@prood/types"
import { z } from "zod"

// ---------------------------------------------------------------------------
// Shared Zod input schemas. Used to validate requests, generate the OpenAPI
// request bodies/parameters, and shape the MCP tool inputs — one source of
// truth for the contract.
// ---------------------------------------------------------------------------

/** JSONB localized field — at least English is required on write */
export const localizedFieldSchema = z
  .record(z.string(), z.string())
  .refine((obj) => typeof obj.en === "string" && obj.en.length > 0, {
    message: "en is required",
  })

export const optionalLocalizedFieldSchema = z.record(z.string(), z.string()).optional()

/**
 * Images must render through next/image, which only serves the hosts in each
 * app's `images.remotePatterns` and skips that check entirely for SVG.
 */
function isServableImageUrl(value: string): boolean {
  if (!URL.canParse(value)) return false
  const url = new URL(value)
  // The media Worker decodes paths, so check what it would actually serve.
  if (/(\.|%2e)svg(%20|\/)*$/i.test(url.pathname)) return false
  const s3PublicUrl = process.env.S3_PUBLIC_URL
  return Boolean(s3PublicUrl) && value.startsWith(`${s3PublicUrl?.replace(/\/$/, "")}/`)
}

const imageUrl = z.url().refine(isServableImageUrl, {
  message: "Use an image uploaded to Prood. SVG files aren't supported.",
})

/** An empty string clears the image. */
const optionalImageUrl = z.union([imageUrl, z.literal("")]).optional()

// ---- Storefront ----

export const searchProductsQuery = z.object({
  query: z.string().optional(),
  categoryId: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
})

export const categoriesQuery = z.object({
  parentId: z.string().optional(),
  depth: z.coerce.number().int().nonnegative().optional(),
})

export const addToCartBody = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
})

export const updateCartItemBody = z.object({
  quantity: z.number().int().nonnegative(),
})

export const couponBody = z.object({ code: z.string().min(1) })

// ---- Admin ----

export const adminListQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(200).optional(),
  search: z.string().optional(),
  sortField: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
})

export const adminListCustomersQuery = adminListQuery.extend({
  sortField: z
    .enum(["createdAt", "spent"])
    .optional()
    .describe("`createdAt`: when the customer was added. `spent`: what they've paid across their orders, less refunds."),
})

export const adminListOrdersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(200).optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
  /** Only open orders still waiting for a payment through this provider */
  awaitingPaymentFrom: z.string().optional(),
  queue: z
    .enum(["open", "to_fulfill"])
    .optional()
    .describe("`open`: not fulfilled or cancelled yet. `to_fulfill`: open, paid and not shipped."),
  sortField: z.enum(["createdAt", "total"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
})

const productImageInput = z.object({
  url: imageUrl,
  altText: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
})

const variantInput = z.object({
  sku: z.string().optional(),
  name: optionalLocalizedFieldSchema,
  price: z.number().optional(),
  compareAtPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  inventoryQuantity: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
})

const attributeInput = z.object({
  code: z.string(),
  name: localizedFieldSchema,
  value: localizedFieldSchema,
})

export const createProductBody = z.object({
  name: localizedFieldSchema,
  slug: z.string().optional(),
  description: optionalLocalizedFieldSchema,
  shortDescription: optionalLocalizedFieldSchema,
  price: z.number().optional(),
  compareAtPrice: z.number().optional(),
  sku: z.string().optional(),
  productType: z.enum(["physical", "digital", "service", "event", "subscription"]).optional(),
  status: z.enum(["draft", "active", "archived"]).optional(),
  inStock: z.boolean().optional(),
  inventoryQuantity: z.number().int().optional(),
  quantityLimit: z.number().int().optional(),
  vatIncluded: z.boolean().optional(),
  vatRate: z.number().optional(),
  requiresShipping: z.boolean().optional(),
  isDropshipped: z.boolean().optional(),
  categories: z.array(z.string()).optional(),
  images: z.array(productImageInput).optional(),
  variants: z.array(variantInput).optional(),
  attributes: z.array(attributeInput).optional(),
  tags: z.array(z.string()).optional(),
})

export const updateProductBody = createProductBody.partial()

export const createCategoryBody = z.object({
  name: localizedFieldSchema,
  slug: z.string().optional(),
  description: optionalLocalizedFieldSchema,
  image: optionalImageUrl,
  parentId: z.string().optional(),
  sortOrder: z.number().int().optional(),
})

export const updateCategoryBody = createCategoryBody.partial()

export const updateInventoryBody = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int(),
  adjustment: z.enum(["set", "increment", "decrement"]).optional(),
})

const CURRENCIES = new Set(Intl.supportedValuesOf("currency"))
const CURRENCY_MESSAGE = "That isn't a currency code. Use an ISO 4217 code, like EUR."
const LOCALE_MESSAGE = `That isn't a language the store can use. Choose one of ${DEFAULT_LOCALES.join(", ")}.`
const TIMEZONE_MESSAGE = "That isn't a timezone. Use an IANA name, like Europe/Lisbon."
const COUNTRY_MESSAGE = "That isn't a country. Use a two-letter country code, like PT."

const regionNames = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" })

function isCountry(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && code !== "ZZ" && regionNames.of(code) !== undefined
}

function isTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value })
    return true
  } catch {
    return false
  }
}

const CONTACT_EMAIL_MESSAGE =
  "We can't use that email. It looks incomplete. Enter the whole address, like ola@casalume.example."
const CONTACT_PHONE_MESSAGE =
  "We can't use that phone number. It should only have digits. Enter it like +351 912 345 678."

export const updateStoreBody = z.object({
  name: optionalLocalizedFieldSchema,
  description: optionalLocalizedFieldSchema
    .nullable()
    .describe("Shown on the store. Send null to remove it."),
  logo: optionalImageUrl,
  favicon: z.string().optional(),
  currency: z
    .string()
    .regex(/^[A-Za-z]{3}$/, CURRENCY_MESSAGE)
    .toUpperCase()
    .refine((code) => CURRENCIES.has(code), CURRENCY_MESSAGE)
    .optional(),
  locale: z.enum(DEFAULT_LOCALES, LOCALE_MESSAGE).optional(),
  timezone: z.string().refine(isTimezone, TIMEZONE_MESSAGE).optional(),
  country: z.string().toUpperCase().refine(isCountry, COUNTRY_MESSAGE).optional(),
  contactEmail: z
    .email(CONTACT_EMAIL_MESSAGE)
    .nullable()
    .optional()
    .describe("Shown on the store and to customers. Send null to remove it."),
  contactPhone: z
    .string()
    .regex(/^\+?[\d\s().-]+$/, CONTACT_PHONE_MESSAGE)
    .refine((phone) => phone.replace(/\D/g, "").length >= 6, CONTACT_PHONE_MESSAGE)
    .nullable()
    .optional()
    .describe("Send null to remove it."),
  address: z.string().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
})

export const fulfillOrderBody = z.object({
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  note: z.string().optional(),
})

export const refundOrderBody = z.object({
  note: z.string().optional(),
  recordOnly: z
    .boolean()
    .optional()
    .describe(
      "Record a refund already sent from the payment account. Prood moves no money."
    ),
})

/** Checkout address (no id / isDefault). */
export const checkoutAddressBody = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  street: z.string().min(1),
  street2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().optional(),
  country: z.string().min(1),
  postalCode: z.string().optional(),
})

export const setShippingMethodBody = z.object({
  methodId: z.string().min(1),
})

export const placeOrderBody = z.object({
  email: z.email().optional(),
  providerId: z.string().optional(),
})

export const cancelOrderBody = z.object({
  note: z.string().optional(),
})

export const listCustomerOrdersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(100).optional(),
})

export type SearchProductsQuery = z.infer<typeof searchProductsQuery>
export type AdminListQuery = z.infer<typeof adminListQuery>
export type AdminListCustomersQuery = z.infer<typeof adminListCustomersQuery>
export const getOrderQuery = z.object({
  /** The email the order was placed with, which shows a guest their payment details */
  email: z.string().optional(),
})

export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuery>
