import { Suspense } from "react"
import Link from "next/link"
import { ShoppingBag } from "@phosphor-icons/react/dist/ssr"
import type { Order } from "@prood/commerce"
import { DashboardEmpty } from "@/components/dashboard-empty"
import { Badge } from "@prood/ui/components/badge"
import { Button } from "@prood/ui/components/button"
import { Card, CardContent } from "@prood/ui/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { formatPrice } from "@prood/ui/lib/commerce"
import { TablePageSkeleton } from "@/components/skeletons"
import { listOrders } from "@/lib/admin-api"

export const metadata = { title: "Orders" }

type StatusVariant = "default" | "secondary" | "destructive" | "outline"

const ORDER_VARIANT: Record<string, StatusVariant> = {
  placed: "secondary",
  approved: "default",
  fulfilled: "default",
  cancelled: "destructive",
}

const PAYMENT_VARIANT: Record<string, StatusVariant> = {
  unpaid: "outline",
  authorized: "secondary",
  paid: "default",
  partially_refunded: "secondary",
  refunded: "destructive",
  voided: "destructive",
  free: "default",
}

const FULFILLMENT_VARIANT: Record<string, StatusVariant> = {
  unfulfilled: "outline",
  in_progress: "secondary",
  fulfilled: "default",
  not_required: "secondary",
}

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Review and fulfill customer orders.
        </p>
      </div>

      <Suspense fallback={<TablePageSkeleton columns={6} />}>
        <OrdersTable />
      </Suspense>
    </div>
  )
}

async function OrdersTable() {
  let orders: Order[] = []
  let failed = false
  try {
    const result = await listOrders({ page: 1, perPage: 50 })
    orders = result.items
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    failed = true
  }

  return (
    <Card>
      <CardContent className="px-0">
        {orders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead>Total</TableHead>
                <TableHead className="pr-5 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="pl-5 font-medium">
                    #{order.orderNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ORDER_VARIANT[order.status] ?? "secondary"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={PAYMENT_VARIANT[order.paymentStatus] ?? "outline"}
                      className="text-xs"
                    >
                      {order.paymentStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={FULFILLMENT_VARIANT[order.fulfillmentStatus] ?? "outline"}
                      className="text-xs"
                    >
                      {order.fulfillmentStatus.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatPrice(order.totals.total)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/orders/${order.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <DashboardEmpty
            className="border-0 py-10"
            icon={ShoppingBag}
            title={failed ? "Orders unavailable" : "No orders yet"}
            description={
              failed
                ? "Could not load orders. Check the API connection."
                : "When customers place orders, they'll show up here."
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
