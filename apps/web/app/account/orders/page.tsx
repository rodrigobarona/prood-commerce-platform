import { redirect } from "next/navigation"
import type { Order } from "@workspace/commerce/types"
import { getCustomerOrders } from "@workspace/commerce"
import { OrderCard } from "@workspace/ui/components/order-card"
import { getCurrentUser } from "@/lib/auth"

export const metadata = { title: "Orders" }

export default async function OrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?redirect=/account/orders")

  let orders: Order[] = []
  try {
    const result = await getCustomerOrders({ perPage: 50 })
    orders = result.items
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
      {orders.length > 0 ? (
        orders.map((order) => <OrderCard key={order.id} order={order} />)
      ) : (
        <p className="text-muted-foreground text-sm">No orders yet.</p>
      )}
    </div>
  )
}
