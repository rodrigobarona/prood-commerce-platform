import type { DiscountablePrice, Maybe, Price } from "@prood/types"
import {
  discountPercent,
  formatOriginalPrice,
  formatPrice,
  hasDiscount,
  type Locale,
} from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface ProductPriceProps {
  price: Maybe<Price | DiscountablePrice> | undefined
  size?: "sm" | "md" | "lg"
  showDiscount?: boolean
  /** Leave the percentage off where space is short; the struck price still shows. */
  showPercent?: boolean
  locale?: Locale
  className?: string
}

const SIZES: Record<NonNullable<ProductPriceProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
}

export function ProductPrice({
  price,
  size = "md",
  showDiscount = true,
  showPercent = true,
  locale = "en",
  className,
}: ProductPriceProps) {
  const discountable = price as Maybe<DiscountablePrice>
  const pct = discountPercent(discountable)

  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      <span className={SIZES[size]}>{formatPrice(price, locale)}</span>
      {showDiscount && hasDiscount(discountable) && (
        <>
          <span className="text-muted-foreground text-sm line-through">
            <span className="sr-only">Was </span>
            {formatOriginalPrice(discountable, locale)}
          </span>
          {showPercent && pct != null && <span className="text-muted-foreground text-xs">-{pct}%</span>}
        </>
      )}
    </div>
  )
}
