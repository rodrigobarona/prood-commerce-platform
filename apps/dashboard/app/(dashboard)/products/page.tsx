import { Suspense } from "react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Package, Plus } from "@phosphor-icons/react/dist/ssr"
import type { Product } from "@prood/commerce"
import { Button } from "@prood/ui/components/button"
import { ListPagination, ListTable, RowLink, SortableHead } from "@prood/ui/components/list-table"
import { ListToolbar, type ListSort } from "@prood/ui/components/list-toolbar"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { PanelEmpty } from "@prood/ui/components/panel-empty"
import { Status } from "@prood/ui/components/status-badge"
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prood/ui/components/table"
import { localized, formatPrice } from "@prood/ui/lib/commerce"
import { lastPage, listHref, readListState, type RawSearchParams } from "@prood/ui/lib/list-params"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { TablePanelSkeleton } from "@/components/skeletons"
import { ProductThumb } from "@/components/store/product-thumb"
import { listProducts } from "@/lib/admin-api"
import { formatDate, humanize } from "@/lib/format"
import { productState } from "@/lib/status"

export const metadata = { title: "Products" }

const PATH = "/products"
const WIDE = "hidden @2xl:table-cell"
const SORTS: ListSort[] = [
  { label: "Newest first", sort: "createdAt", dir: "desc" },
  { label: "Oldest first", sort: "createdAt", dir: "asc" },
  { label: "Name, A to Z", sort: "name", dir: "asc" },
  { label: "Name, Z to A", sort: "name", dir: "desc" },
  { label: "Lowest price", sort: "price", dir: "asc" },
  { label: "Highest price", sort: "price", dir: "desc" },
]

export default function ProductsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  return (
    <DashboardPage>
      <PageHeader
        title="Products"
        description="Everything your store sells."
        actions={
          <Button asChild size="lg">
            <Link href="/products/new">
              <Plus />
              <span>Add product</span>
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<TablePanelSkeleton />}>
        <ProductsTable searchParams={searchParams} />
      </Suspense>
    </DashboardPage>
  )
}

async function ProductsTable({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const list = readListState(await searchParams, {
    sorts: ["createdAt", "name", "price"],
    defaultSort: "createdAt",
  })

  let products: Product[] = []
  let total = 0
  let failed = false
  try {
    const result = await listProducts({
      page: list.page,
      perPage: list.perPage,
      search: list.q || undefined,
      sortField: list.sort,
      sortDirection: list.dir,
    })
    products = result.items
    total = result.total
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    failed = true
  }
  if (products.length === 0 && total > 0) {
    redirect(listHref(PATH, list.params, { page: lastPage(total, list.perPage) }))
  }

  if (failed) {
    return (
      <Panel flush>
        <PanelEmpty
          title="We couldn't load your products"
          description="The store didn't answer. Refresh the page to try again."
        />
      </Panel>
    )
  }

  if (total === 0 && !list.q) {
    return (
      <Panel flush>
        <PanelEmpty
          icon={<Package />}
          title="No products yet"
          description="Products you add show up here and on your store. Add one so customers have something to buy."
          action={
            <Button asChild>
              <Link href="/products/new">Add product</Link>
            </Button>
          }
        />
      </Panel>
    )
  }

  return (
    <Panel flush>
      <ListToolbar searchLabel="Search name or SKU" sorts={SORTS} currentSort={list} />
      {products.length > 0 ? (
        <>
          <ListTable>
            <TableHeader>
              <TableRow>
                <SortableHead list={list} pathname={PATH} field="name">
                  Name
                </SortableHead>
                <TableHead className={WIDE}>Status</TableHead>
                <TableHead className={WIDE}>Type</TableHead>
                <SortableHead list={list} pathname={PATH} field="createdAt" firstDirection="desc" className={WIDE}>
                  Added
                </SortableHead>
                <SortableHead list={list} pathname={PATH} field="price" align="right">
                  Price
                </SortableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const state = productState(product)
                return (
                  <TableRow key={product.id} className="relative">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductThumb url={product.primaryImage?.url} />
                        <div className="min-w-0">
                          <RowLink href={`/products/${product.id}/edit`} stretch>
                            {localized(product.name)}
                          </RowLink>
                          <div className="text-xs text-muted-foreground @2xl:hidden">
                            {humanize(product.productType)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={WIDE}>
                      <Status look={state} />
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground`}>
                      {humanize(product.productType)}
                    </TableCell>
                    <TableCell className={`${WIDE} text-muted-foreground tabular-nums`}>
                      {formatDate(product.createdAt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(product.price) || "—"}
                      <div className="flex justify-end @2xl:hidden">
                        <Status look={state} />
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </ListTable>
          <ListPagination list={list} pathname={PATH} total={total} noun="product" />
        </>
      ) : (
        <PanelEmpty
          title="No products match"
          description={`Nothing is called "${list.q}". Check the spelling, or look through all your products.`}
          action={
            <Button asChild variant="outline">
              <Link href={PATH}>Show all products</Link>
            </Button>
          }
        />
      )}
    </Panel>
  )
}
