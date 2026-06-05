import Link from "next/link"
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr"
import type { Order } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { EmptyState } from "@prood/ui/components/empty-state"
import { OrderTimeline } from "@prood/ui/components/order-timeline"
import { formatPrice, localized } from "@prood/ui/lib/commerce"
import { fetchOrder } from "@/lib/commerce-data"

export const metadata = { title: "Order confirmation" }

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; id?: string }>
}) {
  const sp = await searchParams
  const orderId = sp.orderId ?? sp.id

  let order: Order | null = null
  if (orderId) {
    try {
      order = await fetchOrder(orderId)
    } catch {
      order = null
    }
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <EmptyState
          title="Order not found"
          description="We couldn't find details for this order."
          actionLabel="Continue shopping"
          actionHref="/products"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <CheckCircleIcon size={48} weight="fill" className="text-emerald-500" />
        <h1 className="text-2xl font-bold">Thank you for your order!</h1>
        <p className="text-muted-foreground">Order #{order.orderNumber}</p>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border p-5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {localized(item.name)} × {item.quantity}
            </span>
            <span>{formatPrice(item.totalPrice)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-3 font-semibold">
          <span>Total</span>
          <span>{formatPrice(order.totals.total)}</span>
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        <h2 className="mb-3 font-semibold">Status</h2>
        <OrderTimeline status={order.status} />
      </div>

      <Button asChild>
        <Link href="/products">Continue shopping</Link>
      </Button>
    </div>
  )
}
