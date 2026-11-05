import type { Metadata } from "next"
import type { Product, StoreInfo } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { markdownHref } from "@/lib/markdown-route"

export function storeMetadata(store: Pick<StoreInfo, "name" | "description">): Metadata {
  const name = localized(store.name)
  return {
    title: { default: name, template: `%s · ${name}` },
    description: store.description ? localized(store.description) : undefined,
  }
}

const META_DESCRIPTION_MAX = 160

/** Merchant text, which may hold HTML, as one line of plain text. */
export function plainText(text: string): string {
  return text
    .replace(/<\/?(?:p|div|br|li|ul|ol|h[1-6])\b[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** A product's summary, or else its description, which may hold HTML. */
export function productMetaDescription(product: Pick<Product, "shortDescription" | "description">): string | undefined {
  const text = plainText(localized(product.shortDescription) || localized(product.description))
  return text.slice(0, META_DESCRIPTION_MAX) || undefined
}

/** A page's canonical URL, and where agents can read it as Markdown. */
export function pageAlternates(path: string): Metadata["alternates"] {
  return { canonical: path, types: { "text/markdown": markdownHref(path) } }
}
