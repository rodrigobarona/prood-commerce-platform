import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { Order } from "@prood/commerce"
import { Button } from "@prood/ui/components/button"
import { ListPagination } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { NoOrdersYet } from "@/components/overview/no-orders-yet"
import { TablePanelSkeleton } from "@/components/skeletons"
import { OrdersTable } from "@/components/store/orders-table"
import { getDashboardStats, getStoreSettings, listOrders } from "@/lib/admin-api"
import { orderStatus } from "@/lib/status"

export const metadata = { title: "Orders" }

const PATH = "/orders"
/** Worklists cut across statuses, and the API filters on one of either at a time. */
const QUEUES = ["to_fulfill", "open"] as const
const STATUSES = ["placed", "approved", "fulfilled", "cancelled"] as const
const TABS = [...QUEUES, ...STATUSES]
const SORTS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Highest total", sort: "total", dir: "desc" },
  { label: "Lowest total", sort: "total", dir: "asc" },
]

export default function OrdersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <DashboardPage>
      <PageHeader title="Orders" description="Review, fulfill and refund what customers have bought." />

      <Suspense fallback={<TablePanelSkeleton />}>
        <OrdersList searchParams={searchParams} />
      </Suspense>
    </DashboardPage>
  )
}

async function OrdersList({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const raw = await searchParams
  const list = readListState(raw, {
    tabs: TABS,
    keep: ["customer"],
    sorts: ["createdAt", "total"],
    defaultSort: "createdAt",
    // The oldest paid order is the one that's waited longest.
    defaultDir: raw.status === "to_fulfill" ? "asc" : "desc",
  })
  const queue = QUEUES.find((value) => value === list.tab)
  const customerId = list.params.customer
  const filtered = Boolean(list.q || list.tab || customerId)

  let orders: Order[] = []
  let total = 0
  let failed = false
  try {
    const result = await listOrders({
      page: list.page,
      perPage: list.perPage,
      status: queue ? undefined : list.tab,
      queue,
      sortField: list.sort,
      sortDirection: list.dir,
      customerId,
      search: list.q || undefined,
    })
    orders = result.items
    total = result.total
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    failed = true
  }
  if (orders.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  // The clock and the tab counts are extras, so none may fail the list.
  const [store, stats, toFulfill] = await Promise.all([
    getStoreSettings().catch(() => null),
    getDashboardStats().catch(() => null),
    listOrders({ queue: "to_fulfill", perPage: 1 }).catch(() => null),
  ])

  if (failed) {
    return (
      <Panel flush>
        <PanelEmpty
          title="We couldn't load your orders"
          description="The store didn't answer. Refresh the page to try again."
        />
      </Panel>
    )
  }

  if (total === 0 && !filtered) {
    return (
      <Panel flush>
        <NoOrdersYet stats={stats} settings={store} />
      </Panel>
    )
  }

  // The store-wide counts don't apply inside one customer's orders.
  const counts = customerId ? undefined : stats?.ordersByStatus
  const open = counts ? (counts.placed ?? 0) + (counts.approved ?? 0) : undefined
  const tabs = [
    { value: "", label: "All", count: customerId ? undefined : stats?.totalOrders },
    { value: "to_fulfill", label: "To fulfill", count: customerId ? undefined : toFulfill?.total },
    { value: "open", label: "Open", count: open },
    ...STATUSES.map((status) => ({
      value: status,
      label: orderStatus(status).label,
      count: counts ? (counts[status] ?? 0) : undefined,
    })),
  ]

  return (
    <Panel flush>
      <ListToolbar
        searchLabel="Search order, name or email"
        tabs={tabs}
        tabsLabel="Filter orders by status"
        sorts={SORTS}
        currentSort={list}
      />
      {customerId ? (
        <p className="flex items-center justify-between gap-3 border-b border-border bg-muted/50 px-5 py-2 text-sm text-muted-foreground">
          One customer&apos;s orders
          <Link href={listHref(PATH, list.params, { customer: undefined })} className="text-foreground underline underline-offset-4">
            Show all customers
          </Link>
        </p>
      ) : null}
      {orders.length > 0 ? (
        <>
          <OrdersTable orders={orders} now={new Date()} timeZone={store?.timezone} sortable={{ list, pathname: PATH }} />
          <ListPagination list={list} pathname={PATH} total={total} noun="order" />
        </>
      ) : (
        <PanelEmpty
          title={queue === "to_fulfill" && !list.q ? "Nothing to fulfill" : "No orders match"}
          description={
            queue === "to_fulfill" && !list.q
              ? "Paid orders show up here until you've sent them."
              : "Nothing fits this search and status. Check the spelling, or look through all your orders."
          }
          action={
            <Button asChild variant="outline">
              <Link href={PATH}>Show all orders</Link>
            </Button>
          }
        />
      )}
    </Panel>
  )
}
