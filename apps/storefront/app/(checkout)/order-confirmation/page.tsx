import Image from "next/image"
import Link from "next/link"
import { CheckCircleIcon, WarningCircleIcon } from "@phosphor-icons/react/dist/ssr"
import { orderPaymentState, type Order, type OrderPaymentState } from "@prood/types"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { EmptyState } from "@prood/ui/components/empty-state"
import { MultibancoDetails } from "@prood/ui/components/multibanco-details"
import { OrderTimeline } from "@prood/ui/components/order-timeline"
import { ProductInitial } from "@prood/ui/components/product-initial"
import { deliveryDays, formatPrice, includedVat, localized } from "@prood/ui/lib/commerce"
import { fetchOrder, fetchStoreInfo } from "@/lib/commerce-data"
import { getSession } from "@/lib/auth"
import { CreateAccountCard } from "@/components/checkout/create-account-card"
import { orderStatusCopy } from "@/components/checkout/order-status-copy"
import { JUST_PLACED } from "@/lib/order-href"

export const metadata = { title: "Order confirmation" }

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}

function Detail({ label, lines }: { label: string; lines: (string | null | undefined)[] }) {
  const shown = lines.filter(Boolean)
  if (shown.length === 0) return null
  return (
    <div className="grid gap-1 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-4">
      <dt className="text-muted-foreground">{label}</dt>
      {shown.map((line) => (
        <dd key={line} className="sm:col-start-2">
          {line}
        </dd>
      ))}
    </div>
  )
}

/** How the order was or will be paid, in the shopper's terms. */
function paymentLines(order: Order, paymentState: OrderPaymentState): (string | null)[] {
  const method = order.paymentMethod ? localized(order.paymentMethod.name) : null
  if (paymentState.kind === "settled") return [method, order.paymentStatus === "free" ? "Nothing to pay" : "Paid"]
  if (paymentState.kind === "awaiting_multibanco" || paymentState.kind === "awaiting_payment") {
    return [method, "Waiting for payment"]
  }
  return [method]
}

/** The method and what it promised, so the promise doesn't end at checkout. */
function shippingLine(method: NonNullable<Order["shippingMethod"]>): string {
  const name = localized(method.name)
  return method.estimatedDays ? `${name}, ${deliveryDays(method.estimatedDays)}` : name
}

/**
 * Accounts are emailed at their own address, which needn't be the one on the
 * order. A guest's order comes back without its email, so theirs is the link's.
 */
function confirmationLine(order: Order, linkEmail: string | undefined): string | null {
  if (order.customerId) return "We'll email your confirmation."
  const email = order.contactEmail ?? linkEmail
  return email ? `We'll email your confirmation to ${email}.` : null
}

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; id?: string; email?: string; payment?: string; placed?: string }>
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
      <EmptyState
        headingLevel="h1"
        title="Order not found"
        description="We couldn't find this order. Contact the store with your order number."
        actionLabel="Continue shopping"
        actionHref="/products"
        className="flex-1"
      />
    )
  }

  const [session, store] = await Promise.all([getSession(), fetchStoreInfo().catch(() => null)])
  const isGuest = !session?.user
  const paymentState = orderPaymentState(order)
  const copy = orderStatusCopy(paymentState, {
    couldNotOpenPayment: sp.payment === "failed",
    partlyRefunded: order.paymentStatus === "partially_refunded",
    orderNumber: order.orderNumber,
    contactEmail: store ? store.contactEmail : undefined,
  })
  const customerEmail = sp.email ?? undefined
  const customerName = [order.shippingAddress?.firstName, order.shippingAddress?.lastName]
    .filter(Boolean)
    .join(" ") || undefined

  const totals = order.totals
  const address = order.shippingAddress
  const vat = includedVat(totals.tax)
  const country = address?.country
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(address.country)
    : null
  // Checkout marks its link. Coming back to the order later, the email is long gone.
  const justPlaced = sp.placed === JUST_PLACED
  const emailed = justPlaced && copy.settled ? confirmationLine(order, customerEmail) : null

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-12 md:py-16">
      <header className="flex flex-col gap-3">
        {copy.settled ? (
          <CheckCircleIcon size={32} weight="fill" className="text-success" />
        ) : (
          <WarningCircleIcon size={32} weight="fill" className="text-warning" />
        )}
        <h1 className="text-display-sm text-balance">{copy.title}</h1>
        <p className="text-muted-foreground text-sm">
          Order <span className="text-foreground font-mono">#{order.orderNumber}</span>
        </p>
        {copy.detail ? <p className="text-muted-foreground">{copy.detail}</p> : null}
        {emailed ? <p className="text-muted-foreground">{emailed}</p> : null}
      </header>

      {paymentState.kind === "awaiting_multibanco" ? (
        <MultibancoDetails
          entity={paymentState.details.entity}
          reference={paymentState.details.reference}
          amount={formatPrice(totals.total)}
          expiresAt={paymentState.details.expiresAt}
        />
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-base font-medium">Status</h2>
        <OrderTimeline status={order.status} />
      </section>

      <section className="flex flex-col gap-4 border-t pt-6">
        <h2 className="font-sans text-base font-medium">Your order</h2>
        <ul className="flex flex-col gap-4 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="bg-muted relative aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-lg border">
                {item.image ? (
                  <Image src={item.image.url} alt="" fill sizes="56px" className="object-cover" />
                ) : (
                  <ProductInitial name={localized(item.name)} className="text-2xl" />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{localized(item.name)}</span>
                <span className="text-muted-foreground tabular-nums">
                  {item.variantName ? `${localized(item.variantName)} · ` : null}× {item.quantity}
                </span>
              </span>
              <span className="tabular-nums whitespace-nowrap">{formatPrice(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <dl className="flex flex-col gap-2 border-t pt-4 text-sm">
          <Fact label="Subtotal">{formatPrice(totals.subtotal)}</Fact>
          {totals.shipping ? <Fact label="Shipping">{formatPrice(totals.shipping)}</Fact> : null}
          {totals.discount ? <Fact label="Discount">{`-${formatPrice(totals.discount)}`}</Fact> : null}
        </dl>
        <div className="flex flex-col gap-1 border-t pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <span>Total</span>
            <span className="text-xl tabular-nums">{formatPrice(totals.total)}</span>
          </div>
          {vat ? <p className="text-muted-foreground text-sm">{vat}</p> : null}
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t pt-6">
        <h2 className="font-sans text-base font-medium">Details</h2>
        <dl className="flex flex-col gap-4 text-sm">
          <Detail label="Contact" lines={[order.contactEmail ?? customerEmail, address?.phone]} />
          <Detail label="Payment" lines={paymentLines(order, paymentState)} />
          <Detail
            label="Shipping to"
            lines={
              address
                ? [
                    customerName,
                    [address.street, address.street2].filter(Boolean).join(", "),
                    [address.postalCode, address.city].filter(Boolean).join(" "),
                    country,
                  ]
                : []
            }
          />
          <Detail
            label="Shipping method"
            lines={
              order.shippingMethod
                ? [
                    shippingLine(order.shippingMethod),
                    order.fulfillmentStatus === "fulfilled" && order.trackingNumber ? order.trackingNumber : null,
                  ]
                : []
            }
          />
        </dl>
        {isGuest && !address && order.shippingMethod ? (
          <p className="text-muted-foreground text-sm text-pretty">
            Shipping to the address you gave at checkout. To check it, contact the store.
          </p>
        ) : null}
      </section>

      <CommerceButton asChild>
        <Link href="/products">Continue shopping</Link>
      </CommerceButton>

      {isGuest && customerEmail ? (
        <CreateAccountCard email={customerEmail} name={customerName} />
      ) : null}
    </div>
  )
}
