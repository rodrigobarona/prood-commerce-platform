import Link from "next/link"
import { notFound } from "next/navigation"
import type { Product } from "@workspace/commerce/types"
import { getProduct } from "@workspace/commerce"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import { ProductGallery } from "@workspace/ui/components/product-gallery"
import { ProductPrice } from "@workspace/ui/components/product-price"
import { ReviewStars } from "@workspace/ui/components/review-stars"
import { localized } from "@workspace/ui/lib/commerce"
import { AddToCart } from "@/components/commerce/add-to-cart"

async function loadProduct(slug: string): Promise<Product | null> {
  try {
    return await getProduct({ slug })
  } catch {
    return null
  }
}

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
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{localized(product.name)}</h1>
            {product.rating ? (
              <ReviewStars
                rating={product.rating.average}
                count={product.rating.count}
                showValue
              />
            ) : null}
            <ProductPrice price={product.price} size="lg" />
          </div>

          {product.shortDescription ? (
            <p className="text-muted-foreground">{localized(product.shortDescription)}</p>
          ) : null}

          <AddToCart product={product} />

          {product.description ? (
            <div className="border-t pt-5">
              <h2 className="mb-2 font-semibold">Description</h2>
              <div
                className="prose prose-sm text-muted-foreground max-w-none"
                dangerouslySetInnerHTML={{ __html: localized(product.description) }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
