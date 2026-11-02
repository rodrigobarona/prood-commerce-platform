import { Skeleton } from "@prood/ui/components/skeleton"
import { ProductGridSkeleton } from "@/components/commerce/product-grid-skeleton"
import { Container } from "@/components/layout/container"

export default function ProductsLoading() {
  return (
    <Container className="flex flex-col gap-8 py-10 md:gap-12 md:py-16">
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="h-9 w-full max-w-md rounded-full" />
      </div>
      <ProductGridSkeleton />
    </Container>
  )
}
