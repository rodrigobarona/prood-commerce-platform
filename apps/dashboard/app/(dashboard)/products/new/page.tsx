import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { ProductForm } from "@/components/store/product-form"

export const metadata = { title: "New product" }

export default function NewProductPage() {
  return (
    <DashboardFormPage>
      <div>
        <h2 className="font-heading text-xl font-medium">New product</h2>
        <p className="text-sm text-muted-foreground">
          Add a product to your catalog.
        </p>
      </div>
      <ProductForm />
    </DashboardFormPage>
  )
}
