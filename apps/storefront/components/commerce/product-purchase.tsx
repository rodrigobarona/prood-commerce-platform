"use client"

import { useState, type ReactNode } from "react"
import { firstAvailableVariant, variantPrice, type Product } from "@prood/types"
import { ProductPrice } from "@prood/ui/components/product-price"
import { VariantPicker } from "@prood/ui/components/variant-picker"
import { AddToCart } from "@/components/commerce/add-to-cart"

export function ProductPurchase({
  product,
  heading,
  summary,
}: {
  product: Product
  heading: ReactNode
  summary: ReactNode
}) {
  const [variantId, setVariantId] = useState(() => firstAvailableVariant(product)?.id ?? null)
  const variant = product.variants.find((v) => v.id === variantId) ?? null
  const available = product.inStock && (product.variants.length === 0 || variant !== null)

  return (
    <>
      <div className="flex flex-col gap-2">
        {heading}
        <ProductPrice price={variantPrice(product, variant)} size="lg" />
      </div>

      {summary}

      {product.variants.length > 1 ? (
        <VariantPicker variants={product.variants} value={variantId} onChange={setVariantId} />
      ) : null}

      <AddToCart product={product} variantId={variant?.id} available={available} />
    </>
  )
}
