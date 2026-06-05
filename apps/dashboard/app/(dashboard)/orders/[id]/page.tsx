import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Order } from "@prood/commerce"
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
import { getOrder } from "@/lib/admin-api"

export const metadata = { title: "Order" }

const FULFILLABLE = new Set(["placed", "approved"])
const REFUNDABLE = new Set(["placed", "approved", "fulfilled"])

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
  try {
    order = await getOrder(id)
  } catch {
    notFound()
  }

  const totals = order.totals
  const address = order.shippingAddress

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl font-medium">
              #{order.orderNumber}
            </h2>
            <Badge variant="secondary">{order.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <OrderActions
          orderId={order.id}
          canFulfill={FULFILLABLE.has(order.status)}
          canRefund={REFUNDABLE.has(order.status)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
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

        <Card>
          <CardHeader>
            <CardTitle>Shipping</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {address ? (
              <address className="not-italic text-muted-foreground">
                <span className="block font-medium text-foreground">
                  {address.firstName} {address.lastName}
                </span>
                {address.street}
                {address.street2 ? `, ${address.street2}` : ""}
                <br />
                {address.city}
                {address.state ? `, ${address.state}` : ""}{" "}
                {address.postalCode ?? ""}
                <br />
                {address.country}
                {address.phone ? (
                  <>
                    <br />
                    {address.phone}
                  </>
                ) : null}
              </address>
            ) : (
              <p className="text-muted-foreground">No shipping address.</p>
            )}
            {order.trackingNumber ? (
              <p className="mt-3 text-muted-foreground">
                Tracking:{" "}
                <span className="font-medium text-foreground">
                  {order.trackingNumber}
                </span>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
