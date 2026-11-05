import { Suspense } from "react"
import { redirect } from "next/navigation"
import { ReceiptIcon } from "@phosphor-icons/react/dist/ssr"
import type { Order } from "@prood/types"
import { EmptyState } from "@prood/ui/components/empty-state"
import { OrderCard } from "@prood/ui/components/order-card"
import { Skeleton } from "@prood/ui/components/skeleton"
import { Container } from "@/components/layout/container"
import { getCurrentUser } from "@/lib/auth"
import { fetchCustomerOrders } from "@/lib/commerce-data"
import { orderHref } from "@/lib/order-href"

export const metadata = { title: "Orders" }

function OrdersSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3">
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
      <Skeleton className="h-20 rounded-xl" />
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

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={<ReceiptIcon />}
        title="No orders yet"
        description="Orders you place show up here so you can follow them."
        actionLabel="Browse products"
        actionHref="/products"
      />
    )
  }

  return orders.map((order) => <OrderCard key={order.id} order={order} href={orderHref(order)} />)
}

export default function OrdersPage() {
  return (
    <Container className="max-w-3xl! flex flex-col gap-6 py-10 md:py-16">
      <h1 className="text-display-sm">Orders</h1>
      <div className="flex flex-col gap-3">
        <Suspense fallback={<OrdersSkeleton />}>
          <OrdersList />
        </Suspense>
      </div>
    </Container>
  )
}
