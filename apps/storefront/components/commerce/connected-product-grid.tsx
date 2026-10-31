"use client"

import type { Product } from "@prood/types"
import { ProductGrid } from "@prood/ui/components/product-grid"
import { useCart } from "@/components/providers/cart-provider"

export function ConnectedProductGrid({
  products,
  columns = 4,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
}: {
  products: Product[]
  columns?: 2 | 3 | 4 | 5 | 6
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyActionHref?: string
}) {
  const { addProduct, canTakeOrders } = useCart()
  return (
    <ProductGrid
      products={products}
      columns={columns}
      onAddToCart={canTakeOrders ? addProduct : undefined}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyActionLabel={emptyActionLabel}
      emptyActionHref={emptyActionHref}
    />
  )
}
