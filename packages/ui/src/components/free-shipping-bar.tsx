"use client"

import { PackageIcon, CheckCircleIcon } from "@phosphor-icons/react"
import { cn } from "@prood/ui/lib/utils"

export interface FreeShippingBarProps {
  /** Current cart subtotal in minor units (e.g. cents) */
  subtotal: number
  /** Free shipping threshold in minor units */
  threshold: number
  /** Currency code for formatting */
  currency?: string
  /** Locale for number formatting */
  locale?: string
  className?: string
}

function formatAmount(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

export function FreeShippingBar({
  subtotal,
  threshold,
  currency = "USD",
  locale = "en-US",
  className,
}: FreeShippingBarProps) {
  const remaining = Math.max(0, threshold - subtotal)
  const progress = Math.min(100, (subtotal / threshold) * 100)
  const qualified = remaining === 0

  return (
    <div className={cn("flex flex-col gap-2 rounded-xl border p-4", className)}>
      <div className="flex items-center gap-2 text-sm">
        {qualified ? (
          <CheckCircleIcon className="size-4 shrink-0 text-emerald-500" weight="fill" />
        ) : (
          <PackageIcon className="size-4 shrink-0 text-muted-foreground" />
        )}
        <span>
          {qualified ? (
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              You qualify for free shipping!
            </span>
          ) : (
            <>
              Add{" "}
              <span className="font-semibold">
                {formatAmount(remaining, currency, locale)}
              </span>{" "}
              more for free shipping
            </>
          )}
        </span>
      </div>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            qualified
              ? "bg-emerald-500"
              : progress > 66
                ? "bg-amber-500"
                : "bg-primary",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
