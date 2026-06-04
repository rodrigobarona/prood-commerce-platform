import { Skeleton } from "@prood/ui/components/skeleton"
import { TablePageSkeleton } from "@/components/skeletons"

export default function CustomersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-28" />
        <Skeleton className="mt-1 h-4 w-60" />
      </div>
      <TablePageSkeleton columns={4} />
    </div>
  )
}
