"use client"

import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import type { CartItem } from "@prood/types"
import { ProductInitial } from "@prood/ui/components/product-initial"
import { QuantitySelector } from "@prood/ui/components/quantity-selector"
import { formatPrice, localized, originalLineTotal, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface CartItemRowProps {
  item: CartItem
  loading?: boolean
  locale?: Locale
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemove: (itemId: string) => void
  /** Extra actions beside Remove. */
  actions?: ReactNode
  className?: string
}

export function CartItemRow({
  item,
  loading = false,
  locale = "en",
  onUpdateQuantity,
  onRemove,
  actions,
  className,
}: CartItemRowProps) {
  const url = `/products/${item.productSlug || item.productId}`
  const name = localized(item.name, locale)
  const original = originalLineTotal(item, locale)

  return (
    <div className={cn("flex gap-4", className)}>
      <Link
        href={url}
        tabIndex={-1}
        aria-hidden
        className="bg-muted relative aspect-[4/5] w-20 shrink-0 self-start overflow-hidden rounded-lg sm:w-24"
      >
        {item.image ? (
          <Image
            src={item.image.url}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <ProductInitial name={name} className="text-3xl" />
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3 text-sm">
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link href={url} className="underline-offset-4 hover:underline">
              {name}
            </Link>
            {item.variantName ? (
              <span className="text-muted-foreground">{localized(item.variantName, locale)}</span>
            ) : null}
            {item.quantity > 1 ? (
              <span className="text-muted-foreground tabular-nums">
                {formatPrice(item.price, locale)} each
              </span>
            ) : null}
          </div>
          <span className="flex flex-col items-end tabular-nums whitespace-nowrap">
            {formatPrice(item.totalPrice, locale)}
            {original ? (
              <span className="text-muted-foreground line-through">
                <span className="sr-only">Was </span>
                {original}
              </span>
            ) : null}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <QuantitySelector
            value={item.quantity}
            disabled={loading}
            onChange={(quantity) => onUpdateQuantity(item.id, quantity)}
          />
          <div className="flex items-center gap-x-4 whitespace-nowrap">
            <button
              type="button"
              disabled={loading}
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${name}`}
              className="text-muted-foreground hover:text-foreground py-2 text-sm underline-offset-4 hover:underline disabled:opacity-50"
            >
              Remove
            </button>
            {actions}
          </div>
        </div>
      </div>
    </div>
  )
}
