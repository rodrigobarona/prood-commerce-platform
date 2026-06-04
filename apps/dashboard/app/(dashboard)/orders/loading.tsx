import { Skeleton } from "@prood/ui/components/skeleton"
import { TablePageSkeleton } from "@/components/skeletons"

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="mt-1 h-4 w-56" />
      </div>
      <TablePageSkeleton columns={5} />
    </div>
  )
}
