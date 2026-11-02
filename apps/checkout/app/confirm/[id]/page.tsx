import { Suspense } from "react"
import { Skeleton } from "@prood/ui/components/skeleton"
import { STORE_HINT_PARAM, readStoreHint } from "@prood/checkout-host"
import { PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE } from "@prood/types"
import { ConfirmClient } from "./confirm-client"

interface ConfirmPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function Confirm({ params, searchParams }: ConfirmPageProps) {
  const { id } = await params
  const query = await searchParams
  return (
    <ConfirmClient
      sessionId={id}
      declined={query[PAYMENT_DECLINED_PARAM] === PAYMENT_DECLINED_VALUE}
      hint={readStoreHint(query[STORE_HINT_PARAM], id)}
    />
  )
}

export default function ConfirmPage(props: ConfirmPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-9 w-3/4 rounded-lg" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      }
    >
      <Confirm {...props} />
    </Suspense>
  )
}
