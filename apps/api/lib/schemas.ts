import { z } from "zod"

// ---------------------------------------------------------------------------
// Shared Zod input schemas. Used to validate requests, generate the OpenAPI
// request bodies/parameters, and shape the MCP tool inputs — one source of
// truth for the contract.
// ---------------------------------------------------------------------------

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

export const adminListOrdersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  perPage: z.coerce.number().int().positive().max(200).optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  search: z.string().optional(),
})

const productImageInput = z.object({
  url: z.url(),
  altText: z.string().optional(),
  sortOrder: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
})

const variantInput = z.object({
  sku: z.string().optional(),
  name: z.string().optional(),
  nameAr: z.string().optional(),
  price: z.number().optional(),
  compareAtPrice: z.number().optional(),
  inStock: z.boolean().optional(),
  inventoryQuantity: z.number().int().optional(),
  sortOrder: z.number().int().optional(),
})

const attributeInput = z.object({
  code: z.string(),
  name: z.string(),
  nameAr: z.string().optional(),
  value: z.string(),
  valueAr: z.string().optional(),
})

export const createProductBody = z.object({
  name: z.string().min(1),
  nameAr: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  shortDescription: z.string().optional(),
  shortDescriptionAr: z.string().optional(),
  price: z.number().optional(),
  compareAtPrice: z.number().optional(),
  currency: z.string().optional(),
  sku: z.string().optional(),
  productType: z.string().optional(),
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
  name: z.string().min(1),
  nameAr: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  image: z.string().optional(),
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

export const updateStoreBody = z.object({
  name: z.string().optional(),
  nameAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  contactEmail: z.email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z.string().optional(),
})

export const fulfillOrderBody = z.object({
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().optional(),
  note: z.string().optional(),
})

export type SearchProductsQuery = z.infer<typeof searchProductsQuery>
export type AdminListQuery = z.infer<typeof adminListQuery>
export type AdminListOrdersQuery = z.infer<typeof adminListOrdersQuery>
