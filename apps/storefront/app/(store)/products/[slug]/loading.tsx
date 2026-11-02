import { Skeleton } from "@prood/ui/components/skeleton"

export default function ProductLoading() {
  return (
    <div className="mx-auto w-full max-w-[84rem] pb-16 md:px-8 md:pt-6 md:pb-24 lg:px-12">
      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-12 xl:gap-20">
        <Skeleton className="aspect-[4/5] rounded-none lg:rounded-lg" />
        <div className="flex flex-col gap-4 px-5 pt-6 md:px-0 lg:pt-2">
          <Skeleton className="h-4 w-32 rounded-md" />
          <Skeleton className="h-9 w-3/4 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-md" />
          <Skeleton className="mt-4 h-12 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
