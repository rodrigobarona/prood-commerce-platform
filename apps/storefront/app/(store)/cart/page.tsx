import { Suspense } from "react"
import { CartView } from "@/components/cart/cart-view"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { SectionHeader } from "@/components/commerce/section-header"
import { Container } from "@/components/layout/container"
import { fetchProductList } from "@/lib/commerce-data"

/** A way on from an empty cart. It's a bonus, so a failure just leaves it out. */
async function Suggestions() {
  const list = await fetchProductList({ perPage: 4 }).catch(() => null)
  const products = list?.products.items ?? []
  if (products.length === 0) return null

  return (
    <section>
      <Container className="flex flex-col gap-6 pb-16 md:gap-8 md:pb-24">
        <SectionHeader title="From the store" href="/products" linkLabel="View all products" />
        <ConnectedProductGrid products={products} columns={4} />
      </Container>
    </section>
  )
}

export default function CartPage() {
  return (
    <CartView
      suggestions={
        <Suspense fallback={null}>
          <Suggestions />
        </Suspense>
      }
    />
  )
}
