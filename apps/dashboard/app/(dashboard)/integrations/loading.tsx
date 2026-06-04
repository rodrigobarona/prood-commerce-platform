import { Skeleton } from "@prood/ui/components/skeleton"
import { IntegrationsSkeleton } from "@/components/skeletons"

export default function IntegrationsLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <IntegrationsSkeleton />
    </div>
  )
}
