// Shared formatting helpers for the commerce UI components.
// React equivalents of the storefront's useLocalizedString / usePrice composables.
import type {
  DiscountablePrice,
  LocalizedString,
  Maybe,
  Price,
  SupportedLocale,
} from "@prood/types"
import { DEFAULT_LOCALE } from "@prood/types"

export type Locale = SupportedLocale | string

/** Resolve a localized string with `requested -> en -> first available` fallback. */
export function localized(
  value: Maybe<LocalizedString> | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!value) return ""
  return value[locale] || value[DEFAULT_LOCALE] || Object.values(value)[0] || ""
}

/** Format a Price for the given locale. `amount` is in major units. */
export function formatPrice(
  price: Maybe<Price> | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!price) return ""
  try {
    const intlLocale = locale === "pt" ? "pt-PT" : locale === "es" ? "es-ES" : "en"
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: price.currency,
    }).format(price.amount)
  } catch {
    return `${price.amount} ${price.currency}`
  }
}

/** Whether a discountable price has an active discount. */
export function hasDiscount(
  price: Maybe<DiscountablePrice> | undefined,
): boolean {
  return (
    !!price &&
    price.originalAmount != null &&
    price.originalAmount > price.amount
  )
}

/** Format the original (pre-discount) price. */
export function formatOriginalPrice(
  price: Maybe<DiscountablePrice> | undefined,
  locale: Locale = DEFAULT_LOCALE,
): string {
  if (!hasDiscount(price) || !price) return ""
  return formatPrice(
    { amount: price.originalAmount as number, currency: price.currency, formatted: "" },
    locale,
  )
}

/** Discount percentage (0–100) or null when not discounted. */
export function discountPercent(
  price: Maybe<DiscountablePrice> | undefined,
): number | null {
  if (!hasDiscount(price) || !price || !price.originalAmount) return null
  if (price.discountPercent != null) return Math.round(price.discountPercent)
  return Math.round(((price.originalAmount - price.amount) / price.originalAmount) * 100)
}

/** Canonical product URL. */
export function resolveProductUrl(product: { slug?: string; id: string }): string {
  return `/products/${product.slug || product.id}`
}
