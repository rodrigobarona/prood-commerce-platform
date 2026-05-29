"use client"

import type { Product } from "@workspace/commerce/types"
import { ProductGrid } from "@workspace/ui/components/product-grid"
import { useCart } from "@/components/providers/cart-provider"

export function ConnectedProductGrid({
  products,
  columns = 4,
}: {
  products: Product[]
  columns?: 2 | 3 | 4 | 5 | 6
}) {
  const { addProduct } = useCart()
  return <ProductGrid products={products} columns={columns} onAddToCart={addProduct} />
}
