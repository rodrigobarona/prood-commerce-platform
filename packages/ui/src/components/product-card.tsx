"use client"

import Image from "next/image"
import Link from "next/link"
import { ShoppingCartIcon } from "@phosphor-icons/react"
import { canQuickAdd, type Product } from "@prood/types"
import { Badge } from "@prood/ui/components/badge"
import { Button } from "@prood/ui/components/button"
import { ProductPrice } from "@prood/ui/components/product-price"
import { ProductTypeBadge } from "@prood/ui/components/product-type-badge"
import { ReviewStars } from "@prood/ui/components/review-stars"
import {
  discountPercent,
  localized,
  resolveProductUrl,
  type Locale,
} from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface ProductCardProps {
  product: Product
  showQuickAdd?: boolean
  showRating?: boolean
  locale?: Locale
  onAddToCart?: (product: Product) => void
  className?: string
}

export function ProductCard({
  product,
  showQuickAdd = true,
  showRating = true,
  locale = "en",
  onAddToCart,
  className,
}: ProductCardProps) {
  const url = resolveProductUrl(product)
  const image = product.primaryImage
  const pct = discountPercent(product.price ?? undefined)

  return (
    <div className={cn("group/card relative flex flex-col gap-3", className)}>
      <Link
        href={url}
        className="bg-muted relative block aspect-square overflow-hidden rounded-2xl"
      >
        {image ? (
          <Image
            src={image.url}
            alt={image.alt || localized(product.name, locale)}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover/card:scale-105"
          />
        ) : null}
        {pct != null ? (
          <Badge variant="destructive" className="absolute left-2 top-2">
            -{pct}%
          </Badge>
        ) : null}
        <ProductTypeBadge type={product.productType} className="absolute right-2 top-2" />
        {!product.inStock ? (
          <div className="bg-background/60 absolute inset-0 flex items-center justify-center text-sm font-medium">
            Out of stock
          </div>
        ) : null}
        {showQuickAdd && onAddToCart && canQuickAdd(product) ? (
          <div className="absolute inset-x-2 bottom-2 translate-y-2 opacity-0 transition-all duration-200 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <Button
              type="button"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.preventDefault()
                onAddToCart(product)
              }}
            >
              <ShoppingCartIcon /> Add to cart
            </Button>
          </div>
        ) : null}
      </Link>

      <div className="flex flex-col gap-1">
        <Link href={url} className="line-clamp-2 text-sm font-medium hover:underline">
          {localized(product.name, locale)}
        </Link>
        {showRating && product.rating ? (
          <ReviewStars rating={product.rating.average} count={product.rating.count} size={14} />
        ) : null}
        <ProductPrice price={product.price} size="sm" />
      </div>
    </div>
  )
}
