import { Skeleton } from "@prood/ui/components/skeleton"
import { FormPageSkeleton } from "@/components/skeletons"

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-4">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <FormPageSkeleton />
    </div>
  )
}
