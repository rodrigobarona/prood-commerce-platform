import { cache, Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Product } from "@prood/types"
import { fetchProductBySlug, fetchProductList } from "@/lib/commerce-data"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@prood/ui/components/breadcrumb"
import { ProductGallery } from "@prood/ui/components/product-gallery"
import { ReviewStars } from "@prood/ui/components/review-stars"
import { localized } from "@prood/ui/lib/commerce"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { ProductDetails } from "@/components/commerce/product-details"
import { ProductPurchase } from "@/components/commerce/product-purchase"
import { SectionHeader } from "@/components/commerce/section-header"
import { Container } from "@/components/layout/container"
import { productMetaDescription } from "@/lib/store-metadata"

const loadProduct = cache(fetchProductBySlug)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) return { title: "Product not found" }
  return {
    title: localized(product.name),
    description: productMetaDescription(product),
  }
}

/** The primary image often leads the gallery too. */
function productImages(product: Product) {
  const all = product.primaryImage ? [product.primaryImage, ...product.gallery] : product.gallery
  return all.filter((image, i) => all.findIndex((other) => other.url === image.url) === i)
}

/** More from the product's first category. Nothing to show means no section. */
async function RelatedProducts({ product }: { product: Product }) {
  const category = product.categories[0]
  if (!category) return null

  const list = await fetchProductList({ categoryId: category.id, perPage: 5 })
  const related = list.products.items.filter((item) => item.id !== product.id).slice(0, 4)
  if (related.length === 0) return null

  return (
    <section>
      <Container className="flex flex-col gap-6 pb-16 md:gap-8 md:pb-24">
        <SectionHeader
          title={`More in ${localized(category.name)}`}
          href={`/categories/${category.slug}`}
          linkLabel="View all"
        />
        <ConnectedProductGrid products={related} columns={4} />
      </Container>
    </section>
  )
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) notFound()

  const name = localized(product.name)
  const summary = localized(product.shortDescription)

  return (
    <>
      <div className="mx-auto w-full max-w-[84rem] pb-16 md:px-8 md:pt-6 md:pb-24 lg:px-12">
        <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12 xl:gap-20">
          <ProductGallery images={productImages(product)} alt={name} />

          <div className="flex flex-col gap-6 px-5 pt-6 md:px-0 lg:sticky lg:top-24 lg:self-start lg:pt-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/products">Products</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {product.categories[0] ? (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href={`/categories/${product.categories[0].slug}`}>
                          {localized(product.categories[0].name)}
                        </Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                  </>
                ) : null}
                <BreadcrumbSeparator className="sr-only" />
                <BreadcrumbItem className="sr-only">
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <ProductPurchase
              product={product}
              heading={
                <>
                  <h1 className="text-display-sm text-balance">{name}</h1>
                  {product.rating ? (
                    <ReviewStars
                      rating={product.rating.average}
                      count={product.rating.count}
                      size={14}
                      showValue
                    />
                  ) : null}
                </>
              }
              summary={summary ? <p className="text-muted-foreground">{summary}</p> : null}
              details={<ProductDetails product={product} />}
            />
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <RelatedProducts product={product} />
      </Suspense>
    </>
  )
}
