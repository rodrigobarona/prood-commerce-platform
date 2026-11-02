import { Skeleton } from "@prood/ui/components/skeleton"

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="aspect-[4/5] rounded-lg" />
      <Skeleton className="h-4 w-3/4 rounded-md" />
      <Skeleton className="h-4 w-1/4 rounded-md" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-hidden className="grid grid-cols-2 gap-x-3 gap-y-10 md:gap-x-5 md:gap-y-14 lg:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  )
}
