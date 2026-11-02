// Shared formatting helpers for the commerce UI components.
// React equivalents of the storefront's useLocalizedString / usePrice composables.
import type {
  DiscountablePrice,
  LocalizedString,
  Maybe,
  Price,
  SupportedLocale,
  Cart,
  CartItem,
  PaymentMethodKind,
} from "@prood/types"
import { DEFAULT_LOCALE, FIXED_SHIPPING_RATES } from "@prood/types"

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

/** What the cheapest delivery costs, so shipping isn't a surprise at the last step. */
export function shippingFrom(currency: string, locale: Locale = "en"): string {
  return formatPrice({ amount: FIXED_SHIPPING_RATES.standard.amount, currency, formatted: "" }, locale)
}

const PAYMENT_LABELS: Record<PaymentMethodKind, string> = {
  card: "card",
  multibanco: "Multibanco",
  mbway: "MB WAY",
}

/** How a store takes payment, in a sentence. Null when it isn't known. */
export function paymentChoices(methods: readonly PaymentMethodKind[]): string | null {
  if (methods.length === 0) return null
  const labels = methods.map((method) => PAYMENT_LABELS[method])
  const last = labels.pop()
  return labels.length > 0 ? `${labels.join(", ")} or ${last}` : (last ?? null)
}

export function paymentNote(methods: readonly PaymentMethodKind[]): string | null {
  const choices = paymentChoices(methods)
  return choices ? `Pay by ${choices}.` : null
}

/** How long a shipping method takes, in days. */
export function deliveryDays({ min, max }: { min: number; max: number }): string {
  if (min === max) return `${min} ${min === 1 ? "day" : "days"}`
  return `${min}–${max} days`
}

/** What a line would have cost at its original price. Null without a discount. */
export function originalLineTotal(item: Pick<CartItem, "price" | "quantity">, locale: Locale = "en"): string | null {
  if (!hasDiscount(item.price)) return null
  const amount = (item.price.originalAmount ?? 0) * item.quantity
  return formatPrice({ ...item.price, amount, formatted: "" }, locale)
}

/** The saving across a cart's lines. Null without one. */
export function cartSaving(cart: Pick<Cart, "items" | "totals">, locale: Locale = "en"): string | null {
  const amount = cart.items.reduce(
    (sum, { price, quantity }) => (hasDiscount(price) ? sum + ((price.originalAmount ?? 0) - price.amount) * quantity : sum),
    0,
  )
  if (amount <= 0) return null
  return `You saved ${formatPrice({ ...cart.totals.total, amount, formatted: "" }, locale)}`
}

/** Tax already inside a total, so it reads as part of it rather than as a charge on top. */
export function includedVat(tax: Maybe<Price> | undefined, locale: Locale = "en"): string | null {
  return tax && tax.amount > 0 ? `Including ${formatPrice(tax, locale)} VAT` : null
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

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" })

/** `29 Oct 2026`, whatever the visitor's own locale. */
export function formatDate(value: string | Date): string {
  return DATE_FORMAT.format(new Date(value))
}
