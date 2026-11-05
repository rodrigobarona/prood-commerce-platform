import type { Category, Product, StoreInfo } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { plainText } from "@/lib/store-metadata"

// schema.org descriptions of store pages, for search engines and answer engines.

type Thing = Record<string, unknown>

const CONTEXT = "https://schema.org"

/** Serialized for a `<script type="application/ld+json">`, which must not be able to close itself. */
export function jsonLdScript(data: Thing | Thing[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function productJsonLd(product: Product, origin: string): Thing {
  const url = `${origin}/products/${product.slug}`
  const images = [product.primaryImage, ...product.gallery].flatMap((image) => (image ? [image.url] : []))
  const description = plainText(localized(product.description) || localized(product.shortDescription))
  return {
    "@context": CONTEXT,
    "@type": "Product",
    name: localized(product.name),
    url,
    ...(description ? { description } : {}),
    ...(images.length > 0 ? { image: [...new Set(images)] } : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.categories[0] ? { category: localized(product.categories[0].name) } : {}),
    ...(product.rating && product.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating.average,
            reviewCount: product.rating.count,
          },
        }
      : {}),
    ...(product.price
      ? {
          offers: {
            "@type": "Offer",
            url,
            price: product.price.amount.toFixed(2),
            priceCurrency: product.price.currency,
            availability: `${CONTEXT}/${product.inStock ? "InStock" : "OutOfStock"}`,
          },
        }
      : {}),
  }
}

/** The trail from the catalog down to a page: `[name, path]` pairs. */
export function breadcrumbJsonLd(trail: [string, string][], origin: string): Thing {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${origin}${path}`,
    })),
  }
}

export function collectionJsonLd(category: Category, products: Product[], origin: string): Thing {
  const description = category.description ? plainText(localized(category.description)) : ""
  return {
    "@context": CONTEXT,
    "@type": "CollectionPage",
    name: localized(category.name),
    url: `${origin}/categories/${category.slug}`,
    ...(description ? { description } : {}),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${origin}/products/${product.slug}`,
        name: localized(product.name),
      })),
    },
  }
}

/** The store itself, and how to search it, for the home page. */
export function storeJsonLd(store: Pick<StoreInfo, "name" | "description" | "logo" | "contactEmail">, origin: string): Thing[] {
  const name = localized(store.name)
  const description = store.description ? plainText(localized(store.description)) : ""
  return [
    {
      "@context": CONTEXT,
      "@type": "OnlineStore",
      name,
      url: origin,
      ...(description ? { description } : {}),
      ...(store.logo ? { logo: store.logo.url } : {}),
      ...(store.contactEmail ? { email: store.contactEmail } : {}),
    },
    {
      "@context": CONTEXT,
      "@type": "WebSite",
      name,
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${origin}/products?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ]
}
