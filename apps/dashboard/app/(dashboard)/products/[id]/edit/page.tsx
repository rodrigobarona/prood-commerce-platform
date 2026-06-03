import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Product } from "@prood/commerce"
import { localized } from "@prood/ui/lib/commerce"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { ProductForm } from "@/components/store/product-form"
import { DeleteProductButton } from "@/components/store/delete-product-button"
import { FormPageSkeleton } from "@/components/skeletons"
import { getProduct } from "@/lib/admin-api"

export const metadata = { title: "Edit product" }

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <DashboardFormPage>
      <Suspense fallback={<FormPageSkeleton />}>
        <EditProductContent params={params} />
      </Suspense>
    </DashboardFormPage>
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

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-medium">
            {localized(product.name)}
          </h2>
          <p className="text-sm text-muted-foreground">Edit product details.</p>
        </div>
        <DeleteProductButton productId={product.id} />
      </div>
      <ProductForm
        productId={product.id}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description ?? { en: "", pt: "", es: "" },
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
      />
    </>
  )
}
