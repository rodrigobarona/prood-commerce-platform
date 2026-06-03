import { Suspense } from "react"
import { redirect } from "next/navigation"
import type { Order } from "@prood/types"
import { OrderCard } from "@prood/ui/components/order-card"
import { getCurrentUser } from "@/lib/auth"
import { fetchCustomerOrders } from "@/lib/commerce-data"

export const metadata = { title: "Orders" }

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-24 rounded-lg bg-muted" />
      <div className="h-24 rounded-lg bg-muted" />
      <div className="h-24 rounded-lg bg-muted" />
    </div>
  )
}

async function OrdersList() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?redirect=/account/orders")

  let orders: Order[] = []
  try {
    const result = await fetchCustomerOrders({ perPage: 50 })
    orders = result.items
  } catch {
    /* DB unavailable */
  }

  return (
    <>
      {orders.length > 0 ? (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      ) : (
        <p className="text-muted-foreground text-sm">No orders yet.</p>
      )}
    </>
  )
}

export default function OrdersPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersList />
      </Suspense>
    </div>
  )
}
