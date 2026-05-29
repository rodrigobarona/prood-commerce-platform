import type { Metadata } from "next"
import { PaymentPageClient } from "@/components/payment-page-client"

export const metadata: Metadata = {
  title: "Pay",
}

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="bg-background flex flex-col gap-6 rounded-2xl border p-6 shadow-sm">
      <div className="text-center">
        <h1 className="text-lg font-bold tracking-tight">Secure Checkout</h1>
        <p className="text-muted-foreground text-xs">Powered by CommerceJS</p>
      </div>
      <PaymentPageClient sessionId={id} />
    </div>
  )
}
