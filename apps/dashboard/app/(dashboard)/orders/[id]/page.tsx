import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { OrderHistoryEntry } from "@prood/types"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { BackLink, DetailLayout } from "@prood/ui/components/page-layout"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { Status } from "@prood/ui/components/status-badge"
import { localized, formatPrice } from "@prood/ui/lib/commerce"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { DetailSkeleton, PageHeaderSkeleton } from "@/components/skeletons"
import { Address } from "@/components/store/address"
import { FulfillOrderButton, OrderDangerZone } from "@/components/store/order-actions"
import { ProductThumb } from "@/components/store/product-thumb"
import { getOrder, getOrderHistory, getStoreSettings } from "@/lib/admin-api"
import { formatDateTime, humanize, personName } from "@/lib/format"
import { canFulfillOrder } from "@/lib/order-actions"
import { taxLine } from "@/lib/order-totals"
import { fulfillmentStatus, historyLabel, orderState, paymentStatus } from "@/lib/status"

export const metadata = { title: "Order" }

const CANCELLABLE = new Set(["placed", "approved"])

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <DashboardPage>
          <PageHeaderSkeleton action />
          <DetailSkeleton />
        </DashboardPage>
      }
    >
      <OrderDetail params={params} />
    </Suspense>
  )
}

async function OrderDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let order: Awaited<ReturnType<typeof getOrder>>
  let history: OrderHistoryEntry[]
  try {
    ;[order, history] = await Promise.all([
      getOrder(id),
      getOrderHistory(id),
    ])
  } catch {
    notFound()
  }
  // Only sets the clock the dates are shown in, so it may not fail the page.
  const timeZone = (await getStoreSettings().catch(() => null))?.timezone

  const state = orderState(order)
  const totals = order.totals
  const tax = taxLine(totals)
  const address = order.shippingAddress
  const billing = order.billingAddress
  const details = order.paymentDetails
  const sameBilling = Boolean(address && billing) && JSON.stringify(address) === JSON.stringify(billing)

  return (
    <DashboardPage>
      <PageHeader
        back={<BackLink href="/orders">Orders</BackLink>}
        title={<span className="font-mono text-xl tracking-normal sm:text-2xl">{order.orderNumber}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Status look={state} />
            <span aria-hidden>·</span>
            <span>{paymentStatus(order.paymentStatus).label}</span>
            <span aria-hidden>·</span>
            <span>{formatDateTime(order.createdAt, timeZone)}</span>
          </span>
        }
        actions={canFulfillOrder(order) ? <FulfillOrderButton orderId={order.id} /> : undefined}
      />

      <DetailLayout
        main={
          <>
            <Panel title="Items" flush>
              <ul className="divide-y divide-border">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-5 py-3">
                    <ProductThumb url={item.image?.url} />
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-medium">{localized(item.name)}</span>
                      {item.variantName ? (
                        <span className="text-sm text-muted-foreground">{localized(item.variantName)}</span>
                      ) : null}
                      <span className="text-sm text-muted-foreground tabular-nums">
                        {item.quantity} × {formatPrice(item.price)}
                      </span>
                    </div>
                    <span className="text-sm tabular-nums">{formatPrice(item.totalPrice)}</span>
                  </li>
                ))}
              </ul>
              <FactList className="gap-2 border-t border-border px-5 py-4 tabular-nums">
                <Fact label="Subtotal">{formatPrice(totals.subtotal)}</Fact>
                {totals.shipping ? <Fact label="Shipping">{formatPrice(totals.shipping)}</Fact> : null}
                {totals.discount ? (
                  <Fact label={order.couponCode ? `Discount (${order.couponCode})` : "Discount"}>
                    -{formatPrice(totals.discount)}
                  </Fact>
                ) : null}
                {tax?.added ? <Fact label="Tax">{formatPrice(totals.tax)}</Fact> : null}
                <div className="mt-1 grid grid-cols-[auto_1fr] items-baseline gap-x-4 border-t border-border pt-3">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-right font-medium">{formatPrice(totals.total)}</dd>
                  {tax && !tax.added ? (
                    <dd className="col-span-2 mt-0.5 text-right text-xs text-muted-foreground">
                      Includes {formatPrice(totals.tax)} VAT
                    </dd>
                  ) : null}
                </div>
              </FactList>
            </Panel>

            <Panel title="Timeline">
              {history.length > 0 ? (
                <ol className="flex flex-col gap-4">
                  {history.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
                      <span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground" />
                      <div className="flex min-w-0 flex-col">
                        <span className="text-sm font-medium">{historyLabel(entry.action)}</span>
                        {entry.note ? (
                          <span className="text-sm text-muted-foreground">{entry.note}</span>
                        ) : null}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(entry.createdAt, timeZone)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">Nothing has happened on this order yet.</p>
              )}
            </Panel>
          </>
        }
        aside={
          <>
            <Panel title="Customer">
              {address || order.contactEmail ? (
                <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">
                  {address ? (
                    order.customerId ? (
                      <Link href={`/customers/${order.customerId}`} className="font-medium text-foreground hover:underline">
                        {personName(address)}
                      </Link>
                    ) : (
                      <span className="font-medium text-foreground">{personName(address)}</span>
                    )
                  ) : null}
                  {order.contactEmail ? <span className="wrap-break-word">{order.contactEmail}</span> : null}
                  {address?.phone ? <span>{address.phone}</span> : null}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer details on this order.</p>
              )}
            </Panel>

            <Panel title="Payment">
              <FactList>
                <Fact label="Method">{order.paymentMethod ? localized(order.paymentMethod.name) : "—"}</Fact>
                {order.paymentProvider ? <Fact label="Provider">{humanize(order.paymentProvider)}</Fact> : null}
                {details?.entity ? (
                  <Fact label="Entity">
                    <span className="font-mono">{details.entity}</span>
                  </Fact>
                ) : null}
                {details?.reference ? (
                  <Fact label="Reference">
                    <span className="font-mono">{details.reference}</span>
                  </Fact>
                ) : null}
              </FactList>
            </Panel>

            <Panel title="Shipping">
              <div className="flex flex-col gap-3">
                {address ? (
                  <Address address={address} named={false} />
                ) : (
                  <p className="text-sm text-muted-foreground">This order doesn&apos;t ship.</p>
                )}
                <FactList>
                    <Fact label="Fulfillment">{fulfillmentStatus(order.fulfillmentStatus).label}</Fact>
                    {order.shippingMethod ? (
                      <Fact label="Method">{localized(order.shippingMethod.name)}</Fact>
                    ) : null}
                    {order.trackingNumber ? (
                      <Fact label="Tracking">
                        {order.trackingUrl ? (
                          <a
                            href={order.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono underline-offset-4 hover:underline"
                          >
                            {order.trackingNumber}
                          </a>
                        ) : (
                          <span className="font-mono">{order.trackingNumber}</span>
                        )}
                      </Fact>
                    ) : null}
                </FactList>
              </div>
            </Panel>

            {billing ? (
              <Panel title="Billing address">
                {sameBilling ? (
                  <p className="text-sm text-muted-foreground">Same as the shipping address.</p>
                ) : (
                  <Address address={billing} />
                )}
              </Panel>
            ) : null}
          </>
        }
      />

      <OrderDangerZone
        orderId={order.id}
        // Canceling moves no money, so a paid order only goes through a refund, which cancels it too.
        canCancel={CANCELLABLE.has(order.status) && !order.refund}
        partlyRefunded={order.paymentStatus === "partially_refunded"}
        refund={order.refund}
        refundAmount={formatPrice(totals.total)}
      />
    </DashboardPage>
  )
}
