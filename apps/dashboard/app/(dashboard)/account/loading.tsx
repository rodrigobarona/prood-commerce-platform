import { Skeleton } from "@prood/ui/components/skeleton"
import { FormPageSkeleton } from "@/components/skeletons"

export default function AccountLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 py-4">
      <div>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="mt-1 h-4 w-72" />
      </div>
      <FormPageSkeleton />
    </div>
  )
}
