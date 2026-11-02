import { formatAmount } from "@/lib/format-amount"
import type { OrderSummary, SessionDetails } from "@/lib/session-details"

function Row({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="text-muted-foreground">{name}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}

export function OrderLines({ order, currency }: { order: OrderSummary; currency: string }) {
  return (
    <section aria-label={`Order #${order.number}`} className="flex flex-col gap-2 border-t pt-4 text-sm">
      <p className="text-muted-foreground">Order #{order.number}</p>
      <ul className="flex flex-col gap-1.5">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="min-w-0">
              {item.name}
              {item.variantName ? <span className="text-muted-foreground"> · {item.variantName}</span> : null}
              <span className="text-muted-foreground tabular-nums"> × {item.quantity}</span>
            </span>
            <span className="tabular-nums whitespace-nowrap">{formatAmount(item.amount, currency)}</span>
          </li>
        ))}
        {order.shipping ? (
          <li className="flex justify-between gap-4">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums whitespace-nowrap">{formatAmount(order.shipping, currency)}</span>
          </li>
        ) : null}
      </ul>
    </section>
  )
}

/**
 * What a payment leaves the shopper with, from what the session knows. `pending`
 * means it hasn't arrived yet, so nothing can say it's paid or confirmed.
 */
export function PaymentReceipt({ details, pending = false }: { details: SessionDetails; pending?: boolean }) {
  const { order, amount, currency } = details
  return (
    <div className="flex flex-col gap-3">
      {order ? <OrderLines order={order} currency={currency} /> : null}
      <dl className="flex flex-col divide-y rounded-xl border px-4 py-1">
        <Row name={pending ? "Amount" : "Amount paid"}>{formatAmount(amount, currency)}</Row>
      </dl>
      {order?.emailed && !pending ? (
        <p className="text-muted-foreground text-sm">
          {order.contactEmail
            ? `We'll email your order confirmation to ${order.contactEmail}.`
            : "We'll email your order confirmation."}
        </p>
      ) : null}
    </div>
  )
}
