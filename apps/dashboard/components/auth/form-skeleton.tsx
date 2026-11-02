/* eslint-disable @eslint-react/no-array-index-key -- static placeholder list */
import { Skeleton } from "@prood/ui/components/skeleton"

/** Holds the form's place while the session is checked. */
export function AuthFormSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-40" />
        <Skeleton className="mt-2 h-5 w-full" />
      </div>
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  )
}
