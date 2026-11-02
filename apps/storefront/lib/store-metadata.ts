import type { Metadata } from "next"
import type { Product, StoreInfo } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"

export function storeMetadata(store: Pick<StoreInfo, "name" | "description">): Metadata {
  const name = localized(store.name)
  return {
    title: { default: name, template: `%s · ${name}` },
    description: store.description ? localized(store.description) : undefined,
  }
}

const META_DESCRIPTION_MAX = 160

/** A product's summary, or else its description, which may hold HTML. */
export function productMetaDescription(product: Pick<Product, "shortDescription" | "description">): string | undefined {
  const text = (localized(product.shortDescription) || localized(product.description))
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  return text.slice(0, META_DESCRIPTION_MAX) || undefined
}
