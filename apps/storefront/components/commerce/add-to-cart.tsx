"use client"

import { useState } from "react"
import { ShoppingCartIcon } from "@phosphor-icons/react"
import type { Product } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { QuantitySelector } from "@prood/ui/components/quantity-selector"
import { useCart } from "@/components/providers/cart-provider"

export function AddToCart({ product }: { product: Product }) {
  const { addItem, loading } = useCart()
  const [quantity, setQuantity] = useState(1)
  // Nothing lets a shopper choose between several variants yet.
  const variantId = product.variants.length === 1 ? product.variants[0]?.id : undefined

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={product.quantityLimit ?? 99}
          disabled={!product.inStock}
        />
        <Button
          className="flex-1"
          disabled={loading || !product.inStock}
          onClick={() => addItem({ productId: product.id, variantId, quantity })}
        >
          <ShoppingCartIcon />
          {product.inStock ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
    </div>
  )
}
