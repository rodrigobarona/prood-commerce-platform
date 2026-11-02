"use client"

import { useState, type ReactNode } from "react"
import { firstAvailableVariant, variantPrice, type Product } from "@prood/types"
import { ProductPrice } from "@prood/ui/components/product-price"
import { VariantPicker } from "@prood/ui/components/variant-picker"
import { localized } from "@prood/ui/lib/commerce"
import { AddToCart } from "@/components/commerce/add-to-cart"
import { priceNote } from "@/lib/price-note"
import { variantLabel } from "@/lib/variant-label"

export function ProductPurchase({
  product,
  heading,
  summary,
  details,
}: {
  product: Product
  heading: ReactNode
  summary: ReactNode
  details?: ReactNode
}) {
  const [variantId, setVariantId] = useState(() => firstAvailableVariant(product)?.id ?? null)
  const variant = product.variants.find((v) => v.id === variantId) ?? null
  const available = product.inStock && (product.variants.length === 0 || variant !== null)
  const note = priceNote(product)

  return (
    <>
      <div className="flex flex-col gap-3">
        {heading}
        <div className="flex flex-col gap-1">
          <ProductPrice price={variantPrice(product, variant)} size="lg" />
          {note ? <p className="text-muted-foreground text-sm">{note}</p> : null}
        </div>
      </div>

      {summary}

      {product.variants.length > 1 ? (
        <VariantPicker
          variants={product.variants}
          value={variantId}
          onChange={setVariantId}
          label={variantLabel(product.variants)}
        />
      ) : null}

      <AddToCart
        product={product}
        variantId={variant?.id}
        variantName={product.variants.length > 1 ? localized(variant?.name) : undefined}
        available={available}
      />

      {details}
    </>
  )
}
