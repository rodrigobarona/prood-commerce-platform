"use client"

import { useState } from "react"
import Image from "next/image"
import { CaretDownIcon } from "@phosphor-icons/react"
import type { Cart } from "@prood/types"
import { ProductInitial } from "@prood/ui/components/product-initial"
import {
  cartSaving,
  formatPrice,
  includedVat,
  localized,
  originalLineTotal,
  shippingFrom,
  type Locale,
} from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  )
}

export interface CheckoutSidebarProps {
  cart: Cart
  locale?: Locale
  className?: string
}

export function CheckoutSidebar({
  cart,
  locale = "en",
  className,
}: CheckoutSidebarProps) {
  const [expanded, setExpanded] = useState(false)
  const t = cart.totals
  const shippingToCome = cart.requiresShipping && !t.shipping
  const vat = includedVat(t.tax, locale)
  const saving = cartSaving(cart, locale)

  return (
    <section aria-label="Order summary" className={cn("flex flex-col gap-5", className)}>
      {/* Phones keep the order folded away above the form */}
      <button
        type="button"
        aria-expanded={expanded}
        className="flex items-center justify-between gap-4 lg:hidden"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="flex items-center gap-1.5 text-sm">
          {expanded ? "Hide" : "Show"} order summary ({cart.itemCount})
          <CaretDownIcon className={cn("size-3.5 transition-transform duration-200", expanded && "rotate-180")} />
        </span>
        <span className="tabular-nums">{formatPrice(t.total, locale)}</span>
      </button>

      <div className={cn("flex-col gap-5", expanded ? "flex" : "hidden lg:flex")}>
        <ul className="flex flex-col gap-4">
          {cart.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <div className="relative shrink-0">
                <div className="bg-muted relative aspect-[4/5] w-14 overflow-hidden rounded-lg border">
                  {item.image ? (
                    <Image src={item.image.url} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <ProductInitial name={localized(item.name, locale)} className="text-2xl" />
                  )}
                </div>
                <span className="bg-foreground text-background absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-[11px] tabular-nums">
                  <span className="sr-only">Quantity </span>
                  {item.quantity}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col text-sm">
                <span>{localized(item.name, locale)}</span>
                {item.variantName ? (
                  <span className="text-muted-foreground">{localized(item.variantName, locale)}</span>
                ) : null}
              </div>
              <span className="flex flex-col items-end text-sm tabular-nums">
                {formatPrice(item.totalPrice, locale)}
                {originalLineTotal(item, locale) ? (
                  <span className="text-muted-foreground line-through">{originalLineTotal(item, locale)}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-2 border-t pt-5">
          <SummaryRow label="Subtotal" value={formatPrice(t.subtotal, locale)} />
          {cart.requiresShipping ? (
            <SummaryRow
              label="Shipping"
              value={t.shipping ? formatPrice(t.shipping, locale) : `From ${shippingFrom(t.total.currency, locale)}`}
            />
          ) : null}
          {t.discount ? (
            <SummaryRow label="Discount" value={`-${formatPrice(t.discount, locale)}`} />
          ) : null}
        </dl>

        <div className="flex flex-col gap-1 border-t pt-5">
          <div className="flex items-baseline justify-between gap-4">
            <span>{shippingToCome ? "Estimated total" : "Total"}</span>
            <span className="text-xl tabular-nums">{formatPrice(t.total, locale)}</span>
          </div>
          {shippingToCome ? <p className="text-muted-foreground text-sm">Before shipping</p> : null}
          {saving ? <p className="text-muted-foreground text-sm">{saving}</p> : null}
          {vat ? <p className="text-muted-foreground text-sm">{vat}</p> : null}
        </div>
      </div>
    </section>
  )
}
