import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import type { AdminCustomer } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { FOLD_CELL_4XL, ListPagination, ListTable, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { formatPrice } from "@prood/ui/lib/commerce"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { NoCustomersYet } from "@/components/overview/no-orders-yet"
import { TablePanelSkeleton } from "@/components/skeletons"
import { getDashboardStats, getStoreSettings, listCustomers } from "@/lib/admin-api"
import { formatDate, personName, formatNumber } from "@/lib/format"

export const metadata = { title: "Customers" }

const PATH = "/customers"
const WIDE = "hidden @4xl:table-cell"
const SORTS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Most spent", sort: "spent", dir: "desc" },
  { label: "Least spent", sort: "spent", dir: "asc" },
]
/** The last column left on a phone, once the ones after it are hidden. */
const EDGE = "@max-4xl:pr-5!"

export default function CustomersPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <DashboardPage>
      <PageHeader title="Customers" description="People who have shopped at your store." />

      <Suspense fallback={<TablePanelSkeleton />}>
        <CustomersTable searchParams={searchParams} />
      </Suspense>
    </DashboardPage>
  )
}

async function CustomersTable({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, { sorts: ["createdAt", "spent"], defaultSort: "createdAt" })

  let customers: AdminCustomer[] = []
  let total = 0
  let failed = false
  try {
    const result = await listCustomers({
      page: list.page,
      perPage: list.perPage,
      search: list.q || undefined,
      sortField: list.sort,
      sortDirection: list.dir,
    })
    customers = result.items
    total = result.total
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    failed = true
  }
  if (customers.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }
  const [store, stats] = await Promise.all([getStoreSettings().catch(() => null), getDashboardStats().catch(() => null)])
  const currency = store?.currency ?? "EUR"

  if (failed) {
    return (
      <Panel flush>
        <PanelEmpty
          title="We couldn't load your customers"
          description="The store didn't answer. Refresh the page to try again."
        />
      </Panel>
    )
  }

  if (total === 0 && !list.q) {
    return (
      <Panel flush>
        <NoCustomersYet stats={stats} settings={store} />
      </Panel>
    )
  }

  return (
    <Panel flush>
      <ListToolbar searchLabel="Search name or email" sorts={SORTS} currentSort={list} foldsAt="4xl" />
      {customers.length > 0 ? (
        <>
          <ListTable>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className={WIDE}>Email</TableHead>
                <TableHead className={`${WIDE} text-right`}>Orders</TableHead>
                <SortableHead list={list} pathname={PATH} field="spent" firstDirection="desc" align="right" className={EDGE}>
                  Spent
                </SortableHead>
                <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" align="right" className={WIDE}>
                  Joined
                </SortableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => {
                const name = personName(customer)
                const named = name !== "—"
                return (
                  <TableRow key={customer.id} className="relative">
                    <TableCell className={FOLD_CELL_4XL}>
                      <RowLink href={`/customers/${customer.id}`} stretch>
                        {named ? name : customer.email}
                      </RowLink>
                      {named ? (
                        <div className="truncate text-xs text-muted-foreground @4xl:hidden">
                          {customer.email}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>{customer.email}</TableCell>
                    <TableCell className={`${WIDE} text-right tabular-nums`}>
                      {formatNumber(customer.orderCount)}
                    </TableCell>
                    <TableCell className={`${EDGE} text-right tabular-nums`}>
                      {formatPrice({ amount: customer.spent, currency, formatted: "" })}
                    </TableCell>
                    <TableCell className={`${WIDE} text-right text-muted-foreground tabular-nums`}>
                      {formatDate(customer.createdAt, store?.timezone)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </ListTable>
          <ListPagination list={list} pathname={PATH} total={total} noun="customer" />
        </>
      ) : (
        <PanelEmpty
          title="No customers match"
          description={`Nobody matches "${list.q}". Check the spelling, or look through all your customers.`}
          action={
            <Button asChild variant="outline">
              <Link href={PATH}>Show all customers</Link>
            </Button>
          }
        />
      )}
    </Panel>
  )
}
