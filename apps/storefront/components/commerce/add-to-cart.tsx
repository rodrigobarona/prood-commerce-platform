"use client"

import { useState } from "react"
import { ShoppingCartIcon } from "@phosphor-icons/react"
import type { Product } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { QuantitySelector } from "@prood/ui/components/quantity-selector"
import { useCart } from "@/components/providers/cart-provider"
import { STORE_CLOSED_MESSAGE, isFree } from "@/lib/store-status"

export function AddToCart({
  product,
  variantId,
  available,
}: {
  product: Product
  variantId?: string
  available: boolean
}) {
  const { addItem, canTakeOrders, loading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const price = product.variants.find((variant) => variant.id === variantId)?.price ?? product.price
  const open = canTakeOrders || isFree(price)
  const purchasable = available && open

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <QuantitySelector
          value={quantity}
          onChange={setQuantity}
          max={product.quantityLimit ?? 99}
          disabled={!purchasable}
        />
        <Button
          className="flex-1"
          disabled={loading || !purchasable}
          onClick={() => addItem({ productId: product.id, variantId, quantity })}
        >
          <ShoppingCartIcon />
          {available ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
      {open ? null : (
        <p className="text-muted-foreground text-sm">{STORE_CLOSED_MESSAGE}</p>
      )}
    </div>
  )
}
