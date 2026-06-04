import { Skeleton } from "@prood/ui/components/skeleton"
import { StatCardsSkeleton, RecentOrdersSkeleton } from "@/components/skeletons"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-24" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <StatCardsSkeleton />
      <RecentOrdersSkeleton />
    </div>
  )
}
