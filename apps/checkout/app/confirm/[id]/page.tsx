import { Suspense } from "react"
import { Skeleton } from "@prood/ui/components/skeleton"
import { PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE } from "@prood/types"
import { ConfirmClient } from "./confirm-client"

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const declined = (await searchParams)[PAYMENT_DECLINED_PARAM] === PAYMENT_DECLINED_VALUE

  return (
    <Suspense
      fallback={
        <div className="bg-background flex flex-col gap-4 rounded-2xl border p-6 shadow-sm">
          <Skeleton className="mx-auto h-8 w-3/4" />
          <Skeleton className="mx-auto h-4 w-1/2" />
          <p className="text-muted-foreground text-center text-sm">Confirming your payment...</p>
        </div>
      }
    >
      <ConfirmClient sessionId={id} declined={declined} />
    </Suspense>
  )
}
