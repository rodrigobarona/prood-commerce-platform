import type { Metadata } from "next"
import { PaymentPageClient } from "@/components/payment-page-client"

export const metadata: Metadata = {
  title: "Checkout",
}

export default async function CheckoutSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex flex-col gap-6 rounded-2xl border bg-background p-6 shadow-sm">
      <PaymentPageClient sessionId={id} />
    </div>
  )
}
