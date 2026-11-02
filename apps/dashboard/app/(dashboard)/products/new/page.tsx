import { Suspense } from "react"
import { BackLink } from "@prood/ui/components/page-layout"
import { PageHeader } from "@prood/ui/components/page-header"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { DetailSkeleton } from "@/components/skeletons"
import { ProductForm } from "@/components/store/product-form"
import { getStoreSettings } from "@/lib/admin-api"

export const metadata = { title: "Add product" }

export default function NewProductPage() {
  return (
    <DashboardPage>
      <PageHeader
        back={<BackLink href="/products">Products</BackLink>}
        title="Add product"
        description="Fill in what customers will see. It stays a draft until you set it to active."
      />
      <Suspense fallback={<DetailSkeleton />}>
        <NewProductForm />
      </Suspense>
    </DashboardPage>
  )
}

async function NewProductForm() {
  const store = await getStoreSettings()
  return <ProductForm currency={store.currency} />
}
