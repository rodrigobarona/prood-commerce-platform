import { Skeleton } from "@prood/ui/components/skeleton"
import { DomainsSkeleton } from "@/components/skeletons"

export default function DomainsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <DomainsSkeleton />
    </div>
  )
}
