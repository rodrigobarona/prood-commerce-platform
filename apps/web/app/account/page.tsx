import Link from "next/link"
import { redirect } from "next/navigation"
import type { Order } from "@workspace/commerce/types"
import { getCustomerOrders } from "@workspace/commerce"
import { OrderCard } from "@workspace/ui/components/order-card"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { getCurrentUser } from "@/lib/auth"

export const metadata = { title: "My account" }

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?redirect=/account")

  let orders: Order[] = []
  try {
    const result = await getCustomerOrders({ perPage: 5 })
    orders = result.items
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
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
    </div>
  )
}
