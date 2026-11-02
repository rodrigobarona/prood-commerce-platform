import { ShoppingBagIcon } from "@phosphor-icons/react/dist/ssr"
import type { Product } from "@prood/types"
import { EmptyState } from "@prood/ui/components/empty-state"
import { ProductCard } from "@prood/ui/components/product-card"
import { type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface ProductGridProps {
  products: Product[]
  columns?: 2 | 3 | 4 | 5 | 6
  /** How many leading cards load straight away, for a grid at the top of a page. */
  preloadCount?: number
  locale?: Locale
  onAddToCart?: (product: Product) => void
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyActionHref?: string
  className?: string
}

const COLS: Record<NonNullable<ProductGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 lg:grid-cols-5",
  6: "grid-cols-2 lg:grid-cols-6",
}

/**
 * Cards are 4:5, so a landscape photo fills one by height and needs more width
 * than the card has: 1.875 times for 3:2. This covers most of that, or such a
 * photo is enlarged and goes soft.
 */
const COVER_WIDTH = 1.6

export function ProductGrid({
  products,
  columns = 4,
  preloadCount = 0,
  locale = "en",
  onAddToCart,
  emptyTitle = "No products yet",
  emptyDescription = "This store is adding products. Check back soon.",
  emptyActionLabel,
  emptyActionHref,
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBagIcon />}
        title={emptyTitle}
        description={emptyDescription}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
      />
    )
  }

  // Tall tiles are for photographs. Beside one, a short tile would break the row.
  const short = products.every((product) => !product.primaryImage)

  return (
    <div className={cn("grid gap-x-3 gap-y-10 md:gap-x-5 md:gap-y-14", COLS[columns], className)}>
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          onAddToCart={onAddToCart}
          imageSizes={`(min-width: 1024px) ${Math.ceil((100 / columns) * COVER_WIDTH)}vw, ${50 * COVER_WIDTH}vw`}
          preload={index < preloadCount}
          short={short}
        />
      ))}
    </div>
  )
}
