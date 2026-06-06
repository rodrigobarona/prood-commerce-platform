import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Order } from "@prood/commerce"
import type { OrderHistoryEntry } from "@prood/types"
import { Badge } from "@prood/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { Separator } from "@prood/ui/components/separator"
import { Skeleton } from "@prood/ui/components/skeleton"
import { localized, formatPrice } from "@prood/ui/lib/commerce"
import { OrderActions } from "@/components/store/order-actions"
import { getOrder, getOrderHistory } from "@/lib/admin-api"

export const metadata = { title: "Order" }

const FULFILLABLE = new Set(["placed", "approved"])
const CANCELLABLE = new Set(["placed", "approved"])
const REFUNDABLE = new Set(["approved", "fulfilled"])

type StatusVariant = "default" | "secondary" | "destructive" | "outline"

const ORDER_STATUS_VARIANT: Record<string, StatusVariant> = {
  placed: "secondary",
  approved: "default",
  fulfilled: "default",
  cancelled: "destructive",
}

const PAYMENT_STATUS_VARIANT: Record<string, StatusVariant> = {
  unpaid: "outline",
  authorized: "secondary",
  paid: "default",
  partially_refunded: "secondary",
  refunded: "destructive",
  voided: "destructive",
  free: "default",
}

const FULFILLMENT_STATUS_VARIANT: Record<string, StatusVariant> = {
  unfulfilled: "outline",
  in_progress: "secondary",
  fulfilled: "default",
  not_required: "secondary",
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-xl lg:col-span-2" />
            <Skeleton className="h-48 rounded-xl" />
          </div>
        </div>
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

  let order: Order
  let history: OrderHistoryEntry[]
  try {
    ;[order, history] = await Promise.all([
      getOrder(id),
      getOrderHistory(id),
    ])
  } catch {
    notFound()
  }

  const totals = order.totals
  const address = order.shippingAddress
  const billing = order.billingAddress

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl font-medium">
              #{order.orderNumber}
            </h2>
            <Badge variant={ORDER_STATUS_VARIANT[order.status] ?? "secondary"}>
              {order.status}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={PAYMENT_STATUS_VARIANT[order.paymentStatus] ?? "outline"} className="text-xs">
              Payment: {order.paymentStatus.replace("_", " ")}
            </Badge>
            <Badge variant={FULFILLMENT_STATUS_VARIANT[order.fulfillmentStatus] ?? "outline"} className="text-xs">
              Fulfillment: {order.fulfillmentStatus.replace("_", " ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderActions
          orderId={order.id}
          canFulfill={FULFILLABLE.has(order.status) && order.paymentStatus === "paid"}
          canCancel={CANCELLABLE.has(order.status)}
          canRefund={REFUNDABLE.has(order.status) && order.paymentStatus === "paid"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Items card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {localized(item.name)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Qty {item.quantity} · {formatPrice(item.price)}
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {formatPrice(item.totalPrice)}
                </span>
              </div>
            ))}

            <Separator />

            <dl className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(totals.subtotal)}</dd>
              </div>
              {totals.shipping ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd>{formatPrice(totals.shipping)}</dd>
                </div>
              ) : null}
              {totals.tax ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd>{formatPrice(totals.tax)}</dd>
                </div>
              ) : null}
              {totals.discount ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Discount</dt>
                  <dd>-{formatPrice(totals.discount)}</dd>
                </div>
              ) : null}
              <Separator />
              <div className="flex justify-between font-medium">
                <dt>Total</dt>
                <dd>{formatPrice(totals.total)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          {/* Customer card */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {address || order.contactEmail ? (
                <div className="flex flex-col gap-1 text-muted-foreground">
                  {address ? (
                    <span className="font-medium text-foreground">
                      {address.firstName} {address.lastName}
                    </span>
                  ) : null}
                  {order.contactEmail ? <span>{order.contactEmail}</span> : null}
                  {address?.phone ? <span>{address.phone}</span> : null}
                </div>
              ) : (
                <p className="text-muted-foreground">No customer info.</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping card */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {address ? (
                <address className="not-italic text-muted-foreground">
                  {address.street}
                  {address.street2 ? `, ${address.street2}` : ""}
                  <br />
                  {address.city}
                  {address.state ? `, ${address.state}` : ""}{" "}
                  {address.postalCode ?? ""}
                  <br />
                  {address.country}
                </address>
              ) : (
                <p className="text-muted-foreground">No shipping address.</p>
              )}
              {order.trackingNumber ? (
                <div className="mt-3 flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Tracking</span>
                  {order.trackingUrl ? (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {order.trackingNumber}
                    </a>
                  ) : (
                    <span className="text-sm font-medium">{order.trackingNumber}</span>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Billing card */}
          {billing ? (
            <Card>
              <CardHeader>
                <CardTitle>Billing address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <address className="not-italic text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {billing.firstName} {billing.lastName}
                  </span>
                  <br />
                  {billing.street}
                  {billing.street2 ? `, ${billing.street2}` : ""}
                  <br />
                  {billing.city}
                  {billing.state ? `, ${billing.state}` : ""}{" "}
                  {billing.postalCode ?? ""}
                  <br />
                  {billing.country}
                </address>
              </CardContent>
            </Card>
          ) : null}

          {/* Order history timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ol className="relative border-l border-border pl-4">
                  {history.map((entry) => (
                    <li key={entry.id} className="mb-4 last:mb-0">
                      <span className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-background bg-muted-foreground" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium capitalize">
                          {entry.action.replace("_", " ")}
                        </span>
                        {entry.note ? (
                          <span className="text-xs text-muted-foreground">
                            {entry.note}
                          </span>
                        ) : null}
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
