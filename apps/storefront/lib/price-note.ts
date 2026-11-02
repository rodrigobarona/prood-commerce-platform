import type { Product } from "@prood/types"
import { shippingFrom } from "@prood/ui/lib/commerce"

/**
 * What the price covers, in terms the product's own data can back up. The VAT
 * flag defaults to true, so only a rate someone chose says anything about tax.
 */
export function priceNote(product: Pick<Product, "vatIncluded" | "vatRate" | "requiresShipping" | "price">): string {
  const vat = product.vatRate == null ? null : product.vatIncluded ? "VAT included." : "VAT not included."
  const shipping =
    product.requiresShipping && product.price ? `Shipping from ${shippingFrom(product.price.currency)}.` : null
  return [vat, shipping].filter(Boolean).join(" ")
}
