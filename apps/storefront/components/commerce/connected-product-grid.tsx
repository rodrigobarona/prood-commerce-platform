"use client"

import type { Product } from "@prood/types"
import { ProductGrid } from "@prood/ui/components/product-grid"
import { useCart } from "@/components/providers/cart-provider"

export function ConnectedProductGrid({
  products,
  columns = 4,
}: {
  products: Product[]
  columns?: 2 | 3 | 4 | 5 | 6
}) {
  const { addProduct, canTakeOrders } = useCart()
  return (
    <ProductGrid
      products={products}
      columns={columns}
      onAddToCart={canTakeOrders ? addProduct : undefined}
    />
  )
}
