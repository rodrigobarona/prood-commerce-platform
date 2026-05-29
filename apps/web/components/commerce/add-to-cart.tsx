"use client"

import { useState } from "react"
import { ShoppingCartIcon } from "@phosphor-icons/react"
import type { Product } from "@workspace/commerce/types"
import { Button } from "@workspace/ui/components/button"
import { ProductOptions } from "@workspace/ui/components/product-options"
import { QuantitySelector } from "@workspace/ui/components/quantity-selector"
import { useCart } from "@/components/providers/cart-provider"

export function AddToCart({ product }: { product: Product }) {
  const { addItem, loading } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<Record<string, string>>({})

  // Resolve a variant id from the selected options when possible.
  function resolveVariantId(): string | undefined {
    if (product.variants.length === 0) return undefined
    if (product.variants.length === 1) return product.variants[0]?.id
    const selectedValues = Object.values(options)
    if (selectedValues.length === 0) return undefined
    const match = product.variants.find((variant) =>
      variant.attributes.every((attr) => selectedValues.includes(attr.value.en)),
    )
    return match?.id
  }

  return (
    <div className="flex flex-col gap-4">
      {product.options.length > 0 ? (
        <ProductOptions items={product.options} value={options} onChange={setOptions} />
      ) : null}
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
          onClick={() =>
            addItem({ productId: product.id, variantId: resolveVariantId(), quantity })
          }
        >
          <ShoppingCartIcon />
          {product.inStock ? "Add to cart" : "Out of stock"}
        </Button>
      </div>
    </div>
  )
}
