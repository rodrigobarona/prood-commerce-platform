// ---------------------------------------------------------------------------
// Availability — what a store can sell right now
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Maybe } from '@prood/types'
import type { products } from '../database/drizzle/schema/products.js'
import { findProductVariants, findVariantById } from '../database/index.js'
import { isInStock, resolveLocalized } from './helpers.js'

function refuse(message: string): never {
  throw new CommerceError(message, 'VALIDATION', 422)
}

/**
 * Check a line of an active product and return the variant it sells, if any.
 * A product with variants is only sold as one of them: its base price is not
 * what any variant costs.
 */
export async function requireSellable(product: typeof products.$inferSelect, variantId?: Maybe<string>) {
  const name = resolveLocalized(product.name)
  const variant = variantId ? await findVariantById(variantId) : null

  if (variantId && variant?.productId !== product.id) {
    refuse(`${variantId} is not an option of ${name}.`)
  }
  if (!variant && (await findProductVariants(product.id)).length > 0) {
    refuse(`Choose an option of ${name}.`)
  }
  if (!isInStock(product) || (variant && !isInStock(variant))) {
    refuse(`${name} is out of stock.`)
  }
  if ((variant?.price ?? product.price) == null) {
    refuse(`${name} has no price.`)
  }
  return variant
}
