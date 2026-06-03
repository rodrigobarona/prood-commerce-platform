import { Suspense } from "react"
import { ShoppingBag } from "@phosphor-icons/react/dist/ssr"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { DashboardEmpty } from "@/components/dashboard-empty"
import { Badge } from "@prood/ui/components/badge"
import {
  StatCardsSkeleton,
  RecentOrdersSkeleton,
} from "@/components/skeletons"
import type { DashboardStats } from "@prood/commerce"
import { requireActiveOrg } from "@/lib/admin"
import { getDashboardStats, getStoreSettings } from "@/lib/admin-api"

export const metadata = { title: "Overview" }

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Overview</h2>
        <p className="text-sm text-muted-foreground">
          A snapshot of your store&apos;s performance.
        </p>
      </div>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<RecentOrdersSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}

async function StatsCards() {
  await requireActiveOrg()

  let stats: DashboardStats | null = null
  let currency = "EUR"
  try {
    const [dashboard, settings] = await Promise.all([
      getDashboardStats(),
      getStoreSettings(),
    ])
    stats = dashboard
    currency = settings.currency
  } catch {
    /* API unavailable — show "—" for all values */
  }

  const cards = [
    {
      label: "Revenue",
      value: stats ? formatCurrency(stats.totalRevenue, currency) : "—",
    },
    { label: "Orders", value: stats ? String(stats.totalOrders) : "—" },
    { label: "Customers", value: stats ? String(stats.totalCustomers) : "—" },
    {
      label: "Products",
      value: stats ? `${stats.activeProducts}/${stats.totalProducts}` : "—",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl">{card.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}

async function RecentOrders() {
  await requireActiveOrg()

  let stats: DashboardStats | null = null
  let currency = "EUR"
  try {
    const [dashboard, settings] = await Promise.all([
      getDashboardStats(),
      getStoreSettings(),
    ])
    stats = dashboard
    currency = settings.currency
  } catch {
    /* API unavailable — show empty state */
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Latest activity in your store.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {stats && stats.recentOrders.length > 0 ? (
          stats.recentOrders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  #{order.orderNumber}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{order.status}</Badge>
                <span className="text-sm font-medium">
                  {formatCurrency(order.totals.total.amount, currency)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <DashboardEmpty
            className="border-0 py-8"
            icon={ShoppingBag}
            title="No orders yet"
            description="Recent orders will appear here once you start selling."
          />
        )}
      </CardContent>
    </Card>
  )
}
