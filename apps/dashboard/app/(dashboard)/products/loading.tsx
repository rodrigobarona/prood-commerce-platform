import { Skeleton } from "@prood/ui/components/skeleton"
import { TablePageSkeleton } from "@/components/skeletons"

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="mt-1 h-4 w-52" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>
      <Skeleton className="h-4 w-48" />
      <TablePageSkeleton columns={6} />
    </div>
  )
}
