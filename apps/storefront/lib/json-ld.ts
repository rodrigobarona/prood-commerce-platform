import type { Category, Product, StoreInfo } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { SCHEMA_CONTEXT, type JsonLdThing } from "@prood/ui/lib/json-ld"
import { plainText } from "@/lib/store-metadata"

// schema.org descriptions of store pages, for search engines and answer engines.

export function productJsonLd(product: Product, origin: string): JsonLdThing {
  const url = `${origin}/products/${product.slug}`
  const images = [product.primaryImage, ...product.gallery].flatMap((image) => (image ? [image.url] : []))
  const description = plainText(localized(product.description) || localized(product.shortDescription))
  return {
    "@context": SCHEMA_CONTEXT,
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
            availability: `${SCHEMA_CONTEXT}/${product.inStock ? "InStock" : "OutOfStock"}`,
          },
        }
      : {}),
  }
}

export function collectionJsonLd(category: Category, products: Product[], origin: string): JsonLdThing {
  const description = category.description ? plainText(localized(category.description)) : ""
  return {
    "@context": SCHEMA_CONTEXT,
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
export function storeJsonLd(store: Pick<StoreInfo, "name" | "description" | "logo" | "contactEmail">, origin: string): JsonLdThing[] {
  const name = localized(store.name)
  const description = store.description ? plainText(localized(store.description)) : ""
  return [
    {
      "@context": SCHEMA_CONTEXT,
      "@type": "OnlineStore",
      name,
      url: origin,
      ...(description ? { description } : {}),
      ...(store.logo ? { logo: store.logo.url } : {}),
      ...(store.contactEmail ? { email: store.contactEmail } : {}),
    },
    {
      "@context": SCHEMA_CONTEXT,
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
