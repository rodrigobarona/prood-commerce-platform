// ---------------------------------------------------------------------------
// Variant selection — what a shopper can buy of a product
// ---------------------------------------------------------------------------

import type { DiscountablePrice, Maybe } from './common.js'
import type { Product, ProductVariant } from './product.js'

/** The variant a shopper starts on: the first one they can buy. */
export function firstAvailableVariant(product: Pick<Product, 'variants'>): Maybe<ProductVariant> {
  return product.variants.find(variant => variant.inStock) ?? null
}

/** What a line of `product` costs: a variant without a price sells at the base price. */
export function variantPrice(
  product: Pick<Product, 'price'>,
  variant: Maybe<ProductVariant>,
): Maybe<DiscountablePrice> {
  return variant?.price ?? product.price
}

/** Whether a product can go into the cart with no choice to make. */
export function canQuickAdd(product: Pick<Product, 'inStock' | 'variants'>): boolean {
  if (!product.inStock || product.variants.length > 1) return false
  return product.variants.every(variant => variant.inStock)
}
