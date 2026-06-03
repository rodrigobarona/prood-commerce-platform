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
import { requireActiveOrg } from "@/lib/admin"
import { listOrders } from "@/lib/admin-api"

export const metadata = { title: "Orders" }

export default function OrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Review and fulfill customer orders.
        </p>
      </div>

      <Suspense fallback={<TablePageSkeleton columns={5} />}>
        <OrdersTable />
      </Suspense>
    </div>
  )
}

async function OrdersTable() {
  await requireActiveOrg()

  let orders: Order[] = []
  let failed = false
  try {
    const result = await listOrders({ page: 1, perPage: 50 })
    orders = result.items
  } catch {
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
                    <Badge variant="secondary">{order.status}</Badge>
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
