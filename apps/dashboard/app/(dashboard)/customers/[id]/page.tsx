import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ShoppingBag } from "@phosphor-icons/react/dist/ssr"
import type { AdminCustomer, Order } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { Fact, FactList } from "@prood/ui/components/fact-list"
import { BackLink, DetailLayout } from "@prood/ui/components/page-layout"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { formatPrice } from "@prood/ui/lib/commerce"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { DetailSkeleton, PageHeaderSkeleton } from "@/components/skeletons"
import { Address } from "@/components/store/address"
import { EraseCustomerSection } from "@/components/store/erase-customer-section"
import { OrdersTable } from "@/components/store/orders-table"
import { canManageStore } from "@/lib/admin"
import { getCustomer, getStoreSettings, listOrders } from "@/lib/admin-api"
import { formatDate, personName, formatNumber } from "@/lib/format"

/** The first few on the page; the rest are a link away. */
const RECENT_ORDERS = 10

export const metadata = { title: "Customer" }

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return (
    <Suspense
      fallback={
        <DashboardPage>
          <PageHeaderSkeleton />
          <DetailSkeleton />
        </DashboardPage>
      }
    >
      <CustomerDetail params={params} />
    </Suspense>
  )
}

async function CustomerDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let customer: AdminCustomer
  try {
    customer = await getCustomer(id)
  } catch {
    notFound()
  }
  const [store, recent] = await Promise.all([
    getStoreSettings().catch(() => null),
    listOrders({ customerId: id, perPage: RECENT_ORDERS }).catch((): { items: Order[] } | null => null),
  ])
  const timeZone = store?.timezone
  const canErase = await canManageStore()
  const name = personName(customer)

  return (
    <DashboardPage>
      <PageHeader
        back={<BackLink href="/customers">Customers</BackLink>}
        title={name === "—" ? (customer.email ?? "Customer") : name}
        description={name === "—" ? undefined : customer.email}
      />

      <DetailLayout
        main={
          <>
            <Panel
              title="Orders"
              flush
              actions={
                customer.orderCount > RECENT_ORDERS ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/orders?customer=${customer.id}`}>View all orders</Link>
                  </Button>
                ) : undefined
              }
            >
              {!recent ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  We couldn&apos;t load this customer&apos;s orders. Refresh the page to try again.
                </p>
              ) : recent.items.length > 0 ? (
                <OrdersTable
                  orders={recent.items}
                  now={new Date()}
                  timeZone={timeZone}
                  showCustomer={false}
                />
              ) : (
                <PanelEmpty
                  icon={<ShoppingBag />}
                  title="No orders yet"
                  description="Orders from this customer show up here as soon as they check out."
                />
              )}
            </Panel>

            <Panel title="Addresses" flush>
              {customer.addresses.length > 0 ? (
                <ul className="divide-y divide-border">
                  {customer.addresses.map((address) => (
                    <li key={address.id} className="px-5 py-4">
                      <Address address={address} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-5 py-4 text-sm text-muted-foreground">
                  No saved addresses. They&apos;re added when this customer checks out.
                </p>
              )}
            </Panel>

            {canErase ? <EraseCustomerSection customerId={customer.id} /> : null}
          </>
        }
        aside={
          <Panel title="Customer">
            <FactList>
              <Fact label="Orders">
                <span className="tabular-nums">{formatNumber(customer.orderCount)}</span>
              </Fact>
              <Fact label="Total spent">
                <span className="tabular-nums">
                  {formatPrice({ amount: customer.spent, currency: store?.currency ?? "EUR", formatted: "" })}
                </span>
              </Fact>
              <Fact label="Phone">{customer.phone ?? "—"}</Fact>
              <Fact label="Joined">{formatDate(customer.createdAt, timeZone)}</Fact>
            </FactList>
          </Panel>
        }
      />
    </DashboardPage>
  )
}
