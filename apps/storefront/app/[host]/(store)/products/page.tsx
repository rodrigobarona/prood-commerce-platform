import { CollectionFrame, ProductsPageContent } from "@/components/commerce/collection-page"
import { markdownHref } from "@/lib/markdown-route"

/** No canonical: pages, sorts and searches of the catalog are each their own page. */
export const metadata = { title: "Products", alternates: { types: { "text/markdown": markdownHref("/products") } } }

export default function ProductsPage({ searchParams }: PageProps<"/[host]/products">) {
  return (
    <CollectionFrame>
      <ProductsPageContent searchParams={searchParams} />
    </CollectionFrame>
  )
}
