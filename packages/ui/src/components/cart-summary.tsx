import Link from "next/link"
import type { Cart } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { Separator } from "@prood/ui/components/separator"
import { formatPrice, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface CartSummaryProps {
  cart: Cart
  showCheckout?: boolean
  checkoutLabel?: string
  checkoutHref?: string
  /** Why the shopper can't check out right now. Omit when they can. */
  checkoutDisabledReason?: string
  locale?: Locale
  className?: string
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-muted-foreground flex justify-between">
      <span>{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  )
}

export function CartSummary({
  cart,
  showCheckout = true,
  checkoutLabel = "Proceed to checkout",
  checkoutHref = "/checkout",
  checkoutDisabledReason,
  locale = "en",
  className,
}: CartSummaryProps) {
  const t = cart.totals
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border p-5", className)}>
      <h2 className="text-lg font-semibold">Order summary</h2>
      <div className="flex flex-col gap-2 text-sm">
        <Row label="Subtotal" value={formatPrice(t.subtotal, locale)} />
        {t.shipping ? <Row label="Shipping" value={formatPrice(t.shipping, locale)} /> : null}
        {t.tax ? <Row label="Tax" value={formatPrice(t.tax, locale)} /> : null}
        {t.discount ? (
          <Row label="Discount" value={`-${formatPrice(t.discount, locale)}`} />
        ) : null}
      </div>
      <Separator />
      <div className="flex justify-between text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(t.total, locale)}</span>
      </div>
      {showCheckout && checkoutDisabledReason ? (
        <>
          <p className="text-muted-foreground mt-2 text-sm">{checkoutDisabledReason}</p>
          <Button className="w-full" disabled>
            {checkoutLabel}
          </Button>
        </>
      ) : null}
      {showCheckout && !checkoutDisabledReason ? (
        <Button asChild className="mt-2 w-full" disabled={cart.itemCount === 0}>
          <Link href={checkoutHref}>{checkoutLabel}</Link>
        </Button>
      ) : null}
    </div>
  )
}
