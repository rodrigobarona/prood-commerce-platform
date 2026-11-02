import { Skeleton } from "@prood/ui/components/skeleton"
import { ProductGridSkeleton } from "@/components/commerce/product-grid-skeleton"
import { Container } from "@/components/layout/container"

/** A heading and a row of products: nothing here knows yet whether the store has a hero. */
export default function StoreLoading() {
  return (
    <Container className="flex flex-col gap-6 pt-10 pb-16 md:gap-8 md:pt-14 md:pb-24">
      <Skeleton className="h-9 w-56 rounded-lg" />
      <ProductGridSkeleton count={4} />
    </Container>
  )
}
