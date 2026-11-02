import { Suspense } from "react"
import { STORE_HINT_PARAM, readStoreHint } from "@prood/checkout-host"
import { ShellFallback } from "@/components/checkout-shell"
import { PaymentPageClient } from "@/components/payment-page-client"

interface SessionPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function Session({ params, searchParams }: SessionPageProps) {
  const { id } = await params
  return <PaymentPageClient sessionId={id} hint={readStoreHint((await searchParams)[STORE_HINT_PARAM], id)} />
}

export default function CheckoutSessionPage(props: SessionPageProps) {
  return (
    <Suspense fallback={<ShellFallback />}>
      <Session {...props} />
    </Suspense>
  )
}
