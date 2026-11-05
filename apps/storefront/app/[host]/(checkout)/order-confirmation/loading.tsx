import { Skeleton } from "@prood/ui/components/skeleton"

export default function OrderConfirmationLoading() {
  return (
    <div aria-hidden className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-5 py-12 md:py-16">
      <Skeleton className="h-10 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-1/3 rounded-md" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  )
}
