import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { Order } from "@prood/types"
import { OrderCard } from "@prood/ui/components/order-card"
import { Skeleton } from "@prood/ui/components/skeleton"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Container } from "@/components/layout/container"
import { getCurrentUser } from "@/lib/auth"
import { fetchCustomerOrders } from "@/lib/commerce-data"
import { orderHref } from "@/lib/order-href"

export const metadata = { title: "Your account" }

function AccountSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-48 rounded-lg" />
          <Skeleton className="h-4 w-56 rounded-md" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
    </div>
  )
}

async function AccountContent() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?redirect=/account")

  let orders: Order[] = []
  try {
    const result = await fetchCustomerOrders({ perPage: 5 })
    orders = result.items
  } catch {
    /* DB unavailable */
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-display-sm">Your account</h1>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-sans text-base font-medium">Recent orders</h2>
          {orders.length > 0 ? (
            <Link href="/account/orders" className="text-muted-foreground hover:text-foreground text-sm">
              View all orders
            </Link>
          ) : null}
        </div>
        {orders.length > 0 ? (
          orders.map((order) => <OrderCard key={order.id} order={order} href={orderHref(order)} />)
        ) : (
          <p className="text-muted-foreground text-sm">
            No orders yet. Orders you place show up here so you can follow them.
          </p>
        )}
      </section>
    </>
  )
}

export default function AccountPage() {
  return (
    <Container className="max-w-3xl! flex flex-col gap-10 py-10 md:py-16">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent />
      </Suspense>
    </Container>
  )
}
