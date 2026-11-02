"use client"

import { useState } from "react"
import type { Product } from "@prood/types"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { ProductPrice } from "@prood/ui/components/product-price"
import { QuantitySelector } from "@prood/ui/components/quantity-selector"
import { localized } from "@prood/ui/lib/commerce"
import { useCart } from "@/components/providers/cart-provider"
import { STORE_CLOSED_MESSAGE, isFree } from "@/lib/store-status"
import { useOffScreen } from "@/lib/use-off-screen"

export function AddToCart({
  product,
  variantId,
  variantName,
  available,
}: {
  product: Product
  variantId?: string
  /** Named in the bottom bar, where the picker that chose it may be out of sight. */
  variantName?: string
  available: boolean
}) {
  const { addItem, canTakeOrders, loading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const price = product.variants.find((variant) => variant.id === variantId)?.price ?? product.price
  const open = canTakeOrders || isFree(price)
  const purchasable = available && open

  // Phones get the button in a bar along the bottom once the real one has scrolled away.
  // Not before: the size picker above it may not have been seen yet.
  const [actionsRef, passed] = useOffScreen<HTMLDivElement>("passed")

  const add = () => addItem({ productId: product.id, variantId, quantity })

  return (
    <div className="flex flex-col gap-3">
      <div ref={actionsRef} className="flex items-center gap-3">
        <QuantitySelector
          size="lg"
          value={quantity}
          onChange={setQuantity}
          max={product.quantityLimit ?? 99}
          disabled={loading || !purchasable}
        />
        <CommerceButton className="flex-1"
          disabled={loading || !purchasable}
          onClick={add}
        >
          {available ? "Add to cart" : "Out of stock"}
        </CommerceButton>
      </div>
      {open ? null : (
        <p className="text-muted-foreground text-sm">{STORE_CLOSED_MESSAGE}</p>
      )}

      {passed && purchasable ? (
        <div data-sticky-bar className="bg-background/95 fixed inset-x-0 bottom-0 z-30 flex items-center gap-4 border-t px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
          <div className="flex min-w-0 flex-1 flex-col text-sm">
            <span className="truncate">{localized(product.name)}</span>
            <span className="text-muted-foreground flex items-baseline gap-1.5">
              {variantName ? <span className="shrink-0">{variantName} ·</span> : null}
              <ProductPrice price={price} size="sm" showPercent={false} />
            </span>
          </div>
          <CommerceButton disabled={loading} onClick={add}>
            Add to cart
          </CommerceButton>
        </div>
      ) : null}
    </div>
  )
}
