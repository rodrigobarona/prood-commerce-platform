import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Product } from "@prood/commerce"
import { BackLink } from "@prood/ui/components/page-layout"
import { PageHeader } from "@prood/ui/components/page-header"
import { localized } from "@prood/ui/lib/commerce"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { DetailSkeleton, PageHeaderSkeleton } from "@/components/skeletons"
import { DeleteProductSection } from "@/components/store/delete-product-section"
import { ProductForm } from "@/components/store/product-form"
import { getProduct, getStoreSettings } from "@/lib/admin-api"
import { fieldText } from "@/lib/localized-field"

export const metadata = { title: "Edit product" }

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <DashboardPage>
      <Suspense
        fallback={
          <>
            <PageHeaderSkeleton />
            <DetailSkeleton />
          </>
        }
      >
        <EditProductContent params={params} />
      </Suspense>
    </DashboardPage>
  )
}

async function EditProductContent({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let product: Product
  try {
    product = await getProduct(id)
  } catch {
    notFound()
  }

  const store = await getStoreSettings()

  return (
    <>
      <PageHeader
        back={<BackLink href="/products">Products</BackLink>}
        title={localized(product.name)}
        description="Changes show on your store as soon as you save."
      />
      <ProductForm
        productId={product.id}
        currency={store.currency}
        initial={{
          name: fieldText(product.name),
          slug: product.slug,
          description: fieldText(product.description),
          price: product.price?.amount != null ? String(product.price.amount) : "",
          compareAtPrice:
            product.price?.originalAmount != null
              ? String(product.price.originalAmount)
              : "",
          sku: product.sku ?? "",
          productType: product.productType,
          status: product.status ?? "draft",
          inStock: product.inStock,
          requiresShipping: product.requiresShipping,
        }}
        source={{ name: product.name, description: product.description }}
      />
      <DeleteProductSection productId={product.id} />
    </>
  )
}
