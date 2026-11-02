import type { ProductVariant } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"

const SIZE_NAMES = new Set(["xxs", "xs", "s", "m", "l", "xl", "xxl", "small", "medium", "large", "extra large"])
const MEASURE = /^\d+(\.\d+)?\s?(ml|cl|l|g|kg|mm|cm|m)?$/

/**
 * What a shopper is choosing. Variants carry a name but no option name, so a
 * set that can only be sizes says "Size" and anything else stays general.
 */
export function variantLabel(variants: ProductVariant[]): string {
  const names = variants.map((variant) => localized(variant.name).trim().toLowerCase())
  const allSizes = names.length > 0 && names.every((name) => SIZE_NAMES.has(name) || MEASURE.test(name))
  return allSizes ? "Size" : "Options"
}
