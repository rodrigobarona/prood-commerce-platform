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
import { CopyStoreLink } from "@/components/overview/copy-store-link"
import { SetupChecklist } from "@/components/overview/setup-checklist"
import { getDashboardStats, getStoreSettings } from "@/lib/admin-api"
import { setupChecklist } from "@/lib/setup-checklist"

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

async function loadOverview() {
  try {
    const [stats, settings] = await Promise.all([
      getDashboardStats(),
      getStoreSettings(),
    ])
    return { stats, settings }
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    return null
  }
}

export default function OverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Overview</h2>
        <p className="text-sm text-muted-foreground">
          Orders, customers and products in your store.
        </p>
      </div>

      <Suspense fallback={null}>
        <StoreSetup />
      </Suspense>

      <Suspense fallback={<StatCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<RecentOrdersSkeleton />}>
        <RecentOrders />
      </Suspense>
    </div>
  )
}

async function StoreSetup() {
  const overview = await loadOverview()
  if (!overview) return null
  const { stats, settings } = overview
  const progress = { ...stats, hasContactEmail: Boolean(settings.contactEmail) }
  return <SetupChecklist items={setupChecklist(progress, settings.url)} />
}

async function StatsCards() {
  const overview = await loadOverview()
  const stats = overview?.stats
  const currency = overview?.settings.currency ?? "EUR"

  const cards = [
    {
      label: "Revenue received",
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
  const overview = await loadOverview()
  const stats = overview?.stats
  const currency = overview?.settings.currency ?? "EUR"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardDescription>Latest activity in your store.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!overview ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            We couldn&apos;t load your orders. Refresh the page to try again.
          </p>
        ) : stats && stats.recentOrders.length > 0 ? (
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
            description="Orders show up here as soon as a customer checks out. Share your store link to get the first one."
          >
            <CopyStoreLink url={overview.settings.url} />
          </DashboardEmpty>
        )}
      </CardContent>
    </Card>
  )
}
