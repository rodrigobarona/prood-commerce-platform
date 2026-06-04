import { Skeleton } from "@prood/ui/components/skeleton"
import { TablePageSkeleton } from "@/components/skeletons"

export default function TeamLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
      <TablePageSkeleton columns={4} />
    </div>
  )
}
