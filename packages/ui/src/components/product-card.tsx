"use client"

import Image from "next/image"
import Link from "next/link"
import { PlusIcon } from "@phosphor-icons/react"
import { canQuickAdd, type Product } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { ProductInitial, SHORT_TILE_INITIAL } from "@prood/ui/components/product-initial"
import { ProductPrice } from "@prood/ui/components/product-price"
import { ProductTypeBadge } from "@prood/ui/components/product-type-badge"
import { ReviewStars } from "@prood/ui/components/review-stars"
import { localized, resolveProductUrl, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface ProductCardProps {
  product: Product
  showQuickAdd?: boolean
  showRating?: boolean
  locale?: Locale
  onAddToCart?: (product: Product) => void
  /** Viewport-relative image width, to match the grid the card sits in. */
  imageSizes?: string
  /** Load the image straight away, for cards in the first viewport. */
  preload?: boolean
  /** A short tile for a grid with no photographs, in proportion with the product page's panel. */
  short?: boolean
  className?: string
}

export function ProductCard({
  product,
  showQuickAdd = true,
  showRating = true,
  locale = "en",
  onAddToCart,
  imageSizes = "(min-width: 1024px) 40vw, 80vw",
  preload = false,
  short = false,
  className,
}: ProductCardProps) {
  const url = resolveProductUrl(product)
  const name = localized(product.name, locale)
  const image = product.primaryImage
  const alternate = product.gallery.find((candidate) => candidate.url !== image?.url)

  return (
    <div className={cn("group/card relative flex flex-col gap-3", className)}>
      <div className="relative">
        <Link
          href={url}
          aria-label={name}
          className={cn(
            "bg-muted relative block overflow-hidden rounded-lg",
            short ? "aspect-[3/2]" : "aspect-[4/5]",
          )}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || name}
              fill
              sizes={imageSizes}
              preload={preload}
              className="ease-standard object-cover transition-transform duration-300 group-hover/card:scale-[1.02]"
            />
          ) : (
            <ProductInitial name={name} className={short ? SHORT_TILE_INITIAL : "text-7xl md:text-8xl"} />
          )}
          {image && alternate ? (
            <Image
              src={alternate.url}
              alt=""
              fill
              sizes={imageSizes}
              className="ease-standard object-cover opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
            />
          ) : null}
          <span className="absolute top-2 left-2 flex flex-col items-start gap-1">
            {!product.inStock ? (
              <span className="bg-background text-foreground rounded-md px-2 py-1 text-xs">
                Out of stock
              </span>
            ) : null}
            <ProductTypeBadge type={product.productType} />
          </span>
        </Link>

        {showQuickAdd && onAddToCart && canQuickAdd(product) ? (
          <div className="ease-standard pointer-coarse:hidden absolute inset-x-2 bottom-2 opacity-0 transition-opacity duration-200 group-focus-within/card:opacity-100 group-hover/card:opacity-100">
            <Button
              type="button"
              variant="secondary"
              className="bg-background hover:bg-background/90 h-10 w-full"
              onClick={() => onAddToCart(product)}
            >
              <PlusIcon />
              Add to cart
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-0.5 text-sm">
        <Link href={url} className="line-clamp-2 underline-offset-4 hover:underline">
          {name}
        </Link>
        {showRating && product.rating ? (
          <ReviewStars rating={product.rating.average} count={product.rating.count} size={12} />
        ) : null}
        <ProductPrice price={product.price} size="sm" className="text-muted-foreground" />
      </div>
    </div>
  )
}
