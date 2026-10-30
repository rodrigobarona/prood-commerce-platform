// ---------------------------------------------------------------------------
// Product domain types
// ---------------------------------------------------------------------------

import type { DiscountablePrice, Id, Image, LocalizedString, Maybe } from './common.js'
import type { Category } from './category.js'

/** Product attribute (e.g., color, size, material) */
export interface Attribute {
  /** Machine-readable code (e.g., "color") */
  code: string
  /** Human-readable name */
  name: LocalizedString
  /** Display value */
  value: LocalizedString
}

/** A specific variant of a product (e.g., "Red / XL") */
export interface ProductVariant {
  id: Id
  sku: Maybe<string>
  name: Maybe<LocalizedString>
  price: Maybe<DiscountablePrice>
  inStock: boolean
  inventoryQuantity: Maybe<number>
}

// ---- Product type discriminator ----

/** Classifies the product for fulfillment logic and UI rendering */
export type ProductType = 'physical' | 'digital' | 'service' | 'event' | 'subscription'

/** Core product entity */
export interface Product {
  id: Id
  sku: Maybe<string>
  /** Bilingual product name */
  name: LocalizedString
  slug: string
  /** Bilingual product description (may contain HTML) */
  description: Maybe<LocalizedString>
  /** Short description for listings */
  shortDescription: Maybe<LocalizedString>
  price: Maybe<DiscountablePrice>
  primaryImage: Maybe<Image>
  gallery: Image[]
  rating: Maybe<{
    average: number
    count: number
  }>
  variants: ProductVariant[]
  attributes: Attribute[]
  /** Maximum purchasable quantity (null = unlimited) */
  quantityLimit: Maybe<number>
  categories: Category[]
  inStock: boolean
  /** Whether the displayed price includes VAT */
  vatIncluded: boolean
  /** VAT rate as a decimal (e.g., 0.23 for 23% in Portugal) */
  vatRate: Maybe<number>
  tags: string[]
  createdAt: string
  updatedAt: string

  /** Product classification — drives fulfillment logic and UI. Defaults to 'physical' */
  productType: ProductType

  /** Whether this product requires shipping (false for digital, services, events) */
  requiresShipping: boolean

  // ---- Fulfillment ----

  /** Whether this product is fulfilled by a third-party / dropshipper */
  isDropshipped: boolean

  /** Visibility status: 'draft' | 'active' | 'archived'. Only 'active' products appear on the storefront. */
  status: Maybe<string>
}
