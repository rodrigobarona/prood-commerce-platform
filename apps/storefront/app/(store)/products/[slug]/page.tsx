import { cache } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchProductBySlug } from "@/lib/commerce-data"
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
import { ProductPurchase } from "@/components/commerce/product-purchase"

const loadProduct = cache(fetchProductBySlug)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) return { title: "Product not found" }
  return {
    title: localized(product.name),
    description: product.shortDescription ? localized(product.shortDescription) : undefined,
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) notFound()

  const images = product.primaryImage
    ? [product.primaryImage, ...product.gallery]
    : product.gallery

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/products">Products</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{localized(product.name)}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-10 md:grid-cols-2">
        <ProductGallery images={images} alt={localized(product.name)} />

        <div className="flex flex-col gap-5">
          <ProductPurchase
            product={product}
            heading={
              <>
                <h1 className="text-3xl font-bold tracking-tight">{localized(product.name)}</h1>
                {product.rating ? (
                  <ReviewStars
                    rating={product.rating.average}
                    count={product.rating.count}
                    showValue
                  />
                ) : null}
              </>
            }
            summary={
              product.shortDescription ? (
                <p className="text-muted-foreground">{localized(product.shortDescription)}</p>
              ) : null
            }
          />

          {product.description ? (
            <div className="border-t pt-5">
              <h2 className="mb-2 font-semibold">Description</h2>
              <p className="text-muted-foreground text-sm whitespace-pre-line">
                {localized(product.description)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
