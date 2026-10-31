import { ShoppingBagIcon } from "@phosphor-icons/react/dist/ssr"
import type { Product } from "@prood/types"
import { EmptyState } from "@prood/ui/components/empty-state"
import { ProductCard } from "@prood/ui/components/product-card"
import { type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface ProductGridProps {
  products: Product[]
  columns?: 2 | 3 | 4 | 5 | 6
  locale?: Locale
  onAddToCart?: (product: Product) => void
  emptyTitle?: string
  emptyDescription?: string
  className?: string
}

const COLS: Record<NonNullable<ProductGridProps["columns"]>, string> = {
  2: "grid-cols-2",
  3: "grid-cols-2 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
}

export function ProductGrid({
  products,
  columns = 4,
  locale = "en",
  onAddToCart,
  emptyTitle = "No products yet",
  emptyDescription = "This store is adding products. Check back soon.",
  className,
}: ProductGridProps) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBagIcon />}
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return (
    <div className={cn("grid gap-x-4 gap-y-8", COLS[columns], className)}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          locale={locale}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  )
}
