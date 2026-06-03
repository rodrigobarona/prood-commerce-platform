import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { Order } from "@prood/types"
import { OrderCard } from "@prood/ui/components/order-card"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { getCurrentUser } from "@/lib/auth"
import { fetchCustomerOrders } from "@/lib/commerce-data"

export const metadata = { title: "My account" }

function AccountSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
        </div>
        <div className="h-9 w-24 rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My account</h1>
          <p className="text-muted-foreground text-sm">{user.email}</p>
        </div>
        <SignOutButton />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="text-sm hover:underline">
            View all
          </Link>
        </div>
        {orders.length > 0 ? (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        ) : (
          <p className="text-muted-foreground text-sm">No orders yet.</p>
        )}
      </section>
    </>
  )
}

export default function AccountPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <Suspense fallback={<AccountSkeleton />}>
        <AccountContent />
      </Suspense>
    </div>
  )
}
