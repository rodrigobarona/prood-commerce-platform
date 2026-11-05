import { Suspense } from "react"
import { localized } from "@prood/ui/lib/commerce"
import { ProductPageContent, ProductPageSkeleton } from "@/components/commerce/product-page"
import { fetchProductBySlug } from "@/lib/commerce-data"
import { pageAlternates, productMetaDescription } from "@/lib/store-metadata"

export async function generateMetadata({ params }: PageProps<"/[host]/products/[slug]">) {
  const { slug } = await params
  const product = await fetchProductBySlug(slug)
  if (!product) return { title: "Product not found" }
  return {
    title: localized(product.name),
    description: productMetaDescription(product),
    alternates: pageAlternates(`/products/${product.slug}`),
  }
}

/**
 * Built on a product's first visit and kept until the catalog changes. The
 * slug is read inside the boundary, so a product not built yet still gets the
 * store's header and this skeleton at once.
 */
export default function ProductDetailPage({ params }: PageProps<"/[host]/products/[slug]">) {
  return (
    <Suspense fallback={<ProductPageSkeleton />}>
      <ProductPageContent slug={params.then((p) => p.slug)} />
    </Suspense>
  )
}
