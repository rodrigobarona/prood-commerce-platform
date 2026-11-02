import { cache, Suspense } from "react"
import Link from "next/link"
import { CaretRight, Plus } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { DetailLayout } from "@prood/ui/components/page-layout"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { Stat, StatGrid } from "@prood/ui/components/stat-grid"
import { Status } from "@prood/ui/components/status-badge"
import { formatPrice, localized } from "@prood/ui/lib/commerce"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { NoOrdersYet } from "@/components/overview/no-orders-yet"
import { SetupChecklist } from "@/components/overview/setup-checklist"
import { PageHeaderSkeleton, StatsSkeleton, TablePanelSkeleton } from "@/components/skeletons"
import { OrdersTable } from "@/components/store/orders-table"
import { canManageStore } from "@/lib/admin"
import { getDashboardStats, getStoreSettings, listOrders } from "@/lib/admin-api"
import { getCurrentUser } from "@/lib/auth"
import { formatNumber, greeting } from "@/lib/format"
import { setupChecklist } from "@/lib/setup-checklist"
import { shippingNote } from "@/lib/shipping"
import { getStoreUrl } from "@/lib/store-link"
import { orderStatus } from "@/lib/status"

export const metadata = { title: "Overview" }

/** Statuses in the order a merchant meets them. */
const ORDER_FLOW = ["placed", "approved", "fulfilled", "cancelled"]

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

/** Paid and waiting to ship: the first thing a merchant has to do today. */
const ordersToFulfill = cache(async function ordersToFulfill(): Promise<number> {
  try {
    return (await listOrders({ queue: "to_fulfill", perPage: 1 })).total
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    return 0
  }
})

type Overview = NonNullable<Awaited<ReturnType<typeof loadOverview>>>

/** Orders still in play. The API counts orders by status, nothing finer. */
function openOrders(stats: Overview["stats"]): number {
  return (stats.ordersByStatus.placed ?? 0) + (stats.ordersByStatus.approved ?? 0)
}

/** The comparison under a 30-day number. */
function before(value: number, format: (value: number) => string): string {
  return value > 0 ? `${format(value)} in the 30 days before` : "Nothing in the 30 days before"
}

function waitingLine(overview: Overview): string {
  const store = localized(overview.settings.name)
  const open = openOrders(overview.stats)
  if (open === 0) return `Nothing is waiting at ${store} right now.`
  return `${formatNumber(open)} open ${open === 1 ? "order" : "orders"} at ${store}.`
}

export default function OverviewPage() {
  return (
    <DashboardPage>
      <Suspense fallback={<PageHeaderSkeleton action />}>
        <OverviewHeader />
      </Suspense>

      <Suspense fallback={null}>
        <ToFulfill />
      </Suspense>

      <Suspense fallback={null}>
        <StoreSetup />
      </Suspense>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<TablePanelSkeleton rows={5} />}>
        <RecentOrders />
      </Suspense>
    </DashboardPage>
  )
}

async function OverviewHeader() {
  const [user, overview] = await Promise.all([getCurrentUser(), loadOverview()])
  const hello = greeting(new Date(), overview?.settings.timezone)
  const firstName = user?.name.trim().split(/\s+/)[0]

  return (
    <PageHeader
      title={firstName ? `${hello}, ${firstName}` : hello}
      description={overview ? waitingLine(overview) : "Orders, customers and products in your store."}
      actions={
        <Button asChild size="lg">
          <Link href="/products/new">
            <Plus />
            <span>Add product</span>
          </Link>
        </Button>
      }
    />
  )
}

async function ToFulfill() {
  const count = await ordersToFulfill()
  if (count === 0) return null

  return (
    <Link
      href="/orders?status=to_fulfill"
      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 outline-none transition-colors duration-120 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="font-sans text-sm font-semibold">
          {formatNumber(count)} {count === 1 ? "order" : "orders"} to fulfill
        </span>
        <span className="text-sm text-muted-foreground">Paid and not fulfilled yet.</span>
      </span>
      <CaretRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
    </Link>
  )
}

async function StoreSetup() {
  const [overview, canManage, storeUrl] = await Promise.all([
    loadOverview(),
    canManageStore(),
    getStoreUrl().catch(() => null),
  ])
  if (!overview || !canManage) return null
  const { stats, settings } = overview
  const progress = { ...stats, hasContactEmail: Boolean(settings.contactEmail) }
  return (
    <SetupChecklist
      items={setupChecklist(progress, storeUrl)}
      storeUrl={storeUrl}
      shipping={shippingNote(settings.currency ?? "EUR")}
    />
  )
}

async function StatsCards() {
  const overview = await loadOverview()
  const stats = overview?.stats
  const currency = overview?.settings.currency ?? "EUR"
  const money = (amount: number) => formatPrice({ amount, currency, formatted: "" })

  return (
    <StatGrid className="grid-cols-2 lg:grid-cols-3 [&>*:first-child]:col-span-2">
      <Stat
        label="Revenue, last 30 days"
        href="/orders"
        value={stats ? money(stats.last30Days.revenue) : "—"}
        hint={stats ? `${before(stats.prior30Days.revenue, money)}. ${money(stats.totalRevenue)} all time` : undefined}
      />
      <Stat
        label="Orders, last 30 days"
        href="/orders"
        value={stats ? formatNumber(stats.last30Days.orders) : "—"}
        hint={stats ? before(stats.prior30Days.orders, formatNumber) : undefined}
      />
      <Stat
        label="Open orders"
        href="/orders?status=open"
        value={stats ? formatNumber(openOrders(stats)) : "—"}
        hint={stats?.totalOrders ? `Of ${formatNumber(stats.totalOrders)} in total` : undefined}
      />
      <Stat
        label="Customers"
        href="/customers"
        value={stats ? formatNumber(stats.totalCustomers) : "—"}
        hint="All time"
      />
      <Stat
        label="Active products"
        href="/products"
        value={stats ? formatNumber(stats.activeProducts) : "—"}
        hint={stats?.totalProducts ? `Of ${formatNumber(stats.totalProducts)} in your catalog` : undefined}
      />
    </StatGrid>
  )
}

async function RecentOrders() {
  const overview = await loadOverview()

  if (!overview) {
    return (
      <Panel title="Recent orders" flush>
        <PanelEmpty
          title="We couldn't load your orders"
          description="The store didn't answer. Refresh the page to try again."
        />
      </Panel>
    )
  }

  const { stats, settings } = overview

  if (stats.recentOrders.length === 0) {
    return (
      <Panel title="Recent orders" flush>
        <NoOrdersYet stats={stats} settings={settings} />
      </Panel>
    )
  }

  return (
    <DetailLayout
      main={
        <Panel
          title="Recent orders"
          flush
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/orders">View all orders</Link>
            </Button>
          }
        >
          <OrdersTable orders={stats.recentOrders} now={new Date()} timeZone={settings.timezone} />
        </Panel>
      }
      aside={
        <Panel title="Orders by status">
          <ul className="flex flex-col gap-3">
            {ORDER_FLOW.map((status) => (
              <li key={status}>
                <Link
                  href={`/orders?status=${status}`}
                  className="flex items-center justify-between gap-4 rounded-sm text-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Status look={orderStatus(status)} />
                  <span className="tabular-nums">{formatNumber(stats.ordersByStatus[status] ?? 0)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      }
    />
  )
}
