import { Suspense } from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { ConfirmClient } from "./confirm-client"

export default async function ConfirmPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const query = await searchParams

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
      <ConfirmClient
        sessionId={id}
        chargeId={query.payment_intent ?? query.charge_id ?? null}
      />
    </Suspense>
  )
}
