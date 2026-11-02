import type { Ref } from "react"
import Link from "next/link"
import type { Cart } from "@prood/types"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { cartSaving, formatPrice, includedVat, shippingFrom, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface CartSummaryProps {
  cart: Cart
  showCheckout?: boolean
  checkoutHref?: string
  /** Why the shopper can't check out right now. Omit when they can. */
  checkoutDisabledReason?: string
  /** How the store takes payment, under the button. */
  paymentNote?: string | null
  /** The checkout button, for a page that needs to know when it's in view. */
  checkoutRef?: Ref<HTMLDivElement>
  locale?: Locale
  className?: string
}

/** What the cart's bottom line is, given what's still to come. */
export function cartTotalLabel(cart: Cart): string {
  const { shipping, discount } = cart.totals
  if (!cart.requiresShipping || shipping) return "Total"
  return discount ? "Estimated total" : "Subtotal"
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

export function CartSummary({
  cart,
  showCheckout = true,
  checkoutHref = "/checkout",
  checkoutDisabledReason,
  paymentNote,
  checkoutRef,
  locale = "en",
  className,
}: CartSummaryProps) {
  const t = cart.totals
  const shippingToCome = cart.requiresShipping && !t.shipping
  // With nothing between them, the subtotal would only repeat the total.
  const showRows = t.shipping || t.discount
  const vat = includedVat(t.tax, locale)
  const saving = cartSaving(cart, locale)
  return (
    <div className={cn("bg-muted/50 flex flex-col gap-4 rounded-xl p-5 sm:p-6", className)}>
      <h2 className="text-lg font-medium">Order summary</h2>
      {showRows ? (
        <dl className="flex flex-col gap-2 text-sm">
          <Row label="Subtotal" value={formatPrice(t.subtotal, locale)} />
          {t.shipping ? <Row label="Shipping" value={formatPrice(t.shipping, locale)} /> : null}
          {t.discount ? (
            <Row label="Discount" value={`-${formatPrice(t.discount, locale)}`} />
          ) : null}
        </dl>
      ) : null}
      <div className="flex items-baseline justify-between gap-4 border-t pt-4">
        <span>{cartTotalLabel(cart)}</span>
        <span className="text-xl tabular-nums">{formatPrice(t.total, locale)}</span>
      </div>
      {saving || vat || shippingToCome ? (
        <div className="text-muted-foreground -mt-2 flex flex-col gap-0.5 text-sm">
          {saving ? <p>{saving}</p> : null}
          {vat ? <p>{vat}</p> : null}
          {shippingToCome ? <p>Shipping from {shippingFrom(t.total.currency, locale)}, added at checkout.</p> : null}
        </div>
      ) : null}
      {showCheckout && checkoutDisabledReason ? (
        <>
          <p className="text-muted-foreground text-sm">{checkoutDisabledReason}</p>
          <CommerceButton className="w-full" disabled>
            Check out
          </CommerceButton>
        </>
      ) : null}
      {showCheckout && !checkoutDisabledReason ? (
        <div ref={checkoutRef}>
          <CommerceButton asChild className="w-full" disabled={cart.itemCount === 0}>
            <Link href={checkoutHref}>Check out</Link>
          </CommerceButton>
        </div>
      ) : null}
      {showCheckout && !checkoutDisabledReason && paymentNote ? (
        <p className="text-muted-foreground -mt-2 text-center text-xs">{paymentNote}</p>
      ) : null}
    </div>
  )
}
