"use client"

import { useState } from "react"
import Image from "next/image"
import { CaretDownIcon, CaretUpIcon } from "@phosphor-icons/react"
import type { Cart } from "@prood/types"
import { Separator } from "@prood/ui/components/separator"
import { formatPrice, localized, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string
  value: string
  bold?: boolean
}) {
  return (
    <div
      className={cn(
        "flex justify-between",
        bold ? "text-base font-semibold" : "text-sm text-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className={bold ? "" : "text-foreground"}>{value}</span>
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

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Mobile toggle */}
      <button
        type="button"
        className="flex items-center justify-between lg:hidden"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-medium">
          Order summary ({cart.itemCount} {cart.itemCount === 1 ? "item" : "items"})
        </span>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatPrice(t.total, locale)}</span>
          {expanded ? (
            <CaretUpIcon className="size-4" />
          ) : (
            <CaretDownIcon className="size-4" />
          )}
        </div>
      </button>

      {/* Items list */}
      <div
        className={cn(
          "flex flex-col gap-3",
          expanded ? "block" : "hidden lg:flex",
        )}
      >
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-lg border">
              {item.image ? (
                <Image
                  src={item.image.url}
                  alt={item.image.alt || localized(item.name, locale)}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : null}
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                {item.quantity}
              </span>
            </div>
            <div className="flex flex-1 flex-col justify-center">
              <span className="text-sm font-medium leading-tight">
                {localized(item.name, locale)}
              </span>
              {item.variantName ? (
                <span className="text-xs text-muted-foreground">
                  {localized(item.variantName, locale)}
                </span>
              ) : null}
            </div>
            <span className="self-center text-sm font-medium">
              {formatPrice(item.totalPrice, locale)}
            </span>
          </div>
        ))}
      </div>

      <Separator className={cn(expanded ? "block" : "hidden lg:block")} />

      {/* Totals */}
      <div
        className={cn(
          "flex flex-col gap-2",
          expanded ? "block" : "hidden lg:flex",
        )}
      >
        <SummaryRow label="Subtotal" value={formatPrice(t.subtotal, locale)} />
        {t.shipping ? (
          <SummaryRow label="Shipping" value={formatPrice(t.shipping, locale)} />
        ) : (
          <SummaryRow label="Shipping" value="Calculated next" />
        )}
        {t.tax ? (
          <SummaryRow label="Tax" value={formatPrice(t.tax, locale)} />
        ) : null}
        {t.discount ? (
          <SummaryRow
            label="Discount"
            value={`-${formatPrice(t.discount, locale)}`}
          />
        ) : null}
      </div>

      <Separator className={cn(expanded ? "block" : "hidden lg:block")} />

      {/* Total -- always visible */}
      <SummaryRow label="Total" value={formatPrice(t.total, locale)} bold />
    </div>
  )
}
