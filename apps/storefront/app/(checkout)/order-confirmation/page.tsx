import Link from "next/link"
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
import { orderPaymentState, type Order, type OrderPaymentState } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { EmptyState } from "@prood/ui/components/empty-state"
import { OrderTimeline } from "@prood/ui/components/order-timeline"
import { formatPrice, localized } from "@prood/ui/lib/commerce"
import { fetchOrder } from "@/lib/commerce-data"
import { getSession } from "@/lib/auth"
import { CreateAccountCard } from "@/components/checkout/create-account-card"

export const metadata = { title: "Order confirmation" }

const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function statusCopy(state: OrderPaymentState, couldNotOpenPayment: boolean) {
  switch (state.kind) {
    case "settled":
      return { settled: true, title: "Thank you for your order.", detail: null }
    case "awaiting_multibanco":
      return { settled: false, title: "Order received. Pay by Multibanco to confirm it.", detail: null }
    case "awaiting_payment":
      return couldNotOpenPayment
        ? {
            settled: false,
            title: "Your order is saved, but not paid",
            detail: "We couldn't open payment. Contact the store with this order number to complete it.",
          }
        : {
            settled: false,
            title: "Order received",
            detail: "We're waiting for your payment. We'll email you when it arrives.",
          }
    case "failed":
      return {
        settled: false,
        title: "This order wasn't paid",
        detail: "The payment didn't go through, so you haven't been charged. Contact the store if you still want these items.",
      }
    case "refunded":
      return { settled: false, title: "This order was refunded", detail: "Contact the store if you have any questions." }
    case "partially_refunded":
      return {
        settled: true,
        title: "Thank you for your order.",
        detail: "Part of it was refunded. Contact the store if you have any questions.",
      }
    case "cancelled_paid":
      return {
        settled: false,
        title: "This order was cancelled",
        detail: "Your payment arrived after it was cancelled. The store will refund you.",
      }
  }
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; id?: string; email?: string; payment?: string }>
}) {
  const sp = await searchParams
  const orderId = sp.orderId ?? sp.id

  let order: Order | null = null
  if (orderId) {
    try {
      order = await fetchOrder(orderId, sp.email)
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

  const session = await getSession()
  const isGuest = !session?.user
  const paymentState = orderPaymentState(order)
  const copy = statusCopy(paymentState, sp.payment === "failed")
  const customerEmail = sp.email ?? undefined
  const customerName = [order.shippingAddress?.firstName, order.shippingAddress?.lastName]
    .filter(Boolean)
    .join(" ") || undefined

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-12">
      <div className="flex flex-col items-center gap-2 text-center">
        {copy.settled ? (
          <CheckCircleIcon size={48} weight="fill" className="text-emerald-500" />
        ) : (
          <WarningCircleIcon size={48} weight="fill" className="text-amber-500" />
        )}
        <h1 className="text-2xl font-bold">{copy.title}</h1>
        <p className="text-muted-foreground">Order #{order.orderNumber}</p>
        {copy.detail ? <p className="text-muted-foreground">{copy.detail}</p> : null}
      </div>

      {paymentState.kind === "awaiting_multibanco" ? (
        <dl className="flex flex-col gap-2 rounded-2xl border p-5 text-sm">
          {paymentState.details.entity ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Entity</dt>
              <dd className="font-mono font-medium tabular-nums">{paymentState.details.entity}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Reference</dt>
            <dd className="font-mono font-medium tabular-nums">{paymentState.details.reference}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Amount</dt>
            <dd className="font-medium tabular-nums">{formatPrice(order.totals.total)}</dd>
          </div>
          {paymentState.details.expiresAt ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Pay by</dt>
              <dd className="font-medium tabular-nums">
                {DEADLINE_FORMAT.format(new Date(paymentState.details.expiresAt))}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="flex flex-col gap-3 rounded-2xl border p-5">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {localized(item.name)}
              {item.variantName ? ` (${localized(item.variantName)})` : ""} × {item.quantity}
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

      {isGuest && customerEmail ? (
        <CreateAccountCard email={customerEmail} name={customerName} />
      ) : null}

      <Button asChild>
        <Link href="/products">Continue shopping</Link>
      </Button>
    </div>
  )
}
