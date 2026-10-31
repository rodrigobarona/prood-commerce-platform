import Link from "next/link"
import type { SearchParams } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { fetchProductList } from "@/lib/commerce-data"
import { productListEmptyCopy } from "@/lib/product-empty-copy"

export const metadata = { title: "Products" }

type PageSearchParams = {
  q?: string
  category?: string
  page?: string
  sort?: string
}

function parseSort(sort: string | undefined): SearchParams["sort"] {
  if (!sort) return undefined
  const [field, direction] = sort.split(":")
  if (!field) return undefined
  return { field, direction: direction === "asc" ? "asc" : "desc" }
}

/** Anything but a positive integer is a bad link, which the API would refuse. */
function parsePage(page: string | undefined): number {
  const parsed = Number(page)
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const perPage = 12
  const result = await fetchProductList({
    query: sp.q,
    categoryId: sp.category,
    page,
    perPage,
    sortField: parseSort(sp.sort)?.field,
    sortDirection: parseSort(sp.sort)?.direction,
  })
  const products = result.products.items
  const total = result.products.total

  const hasMore = page * perPage < total
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (sp.q) params.set("q", sp.q)
    if (sp.category) params.set("category", sp.category)
    if (sp.sort) params.set("sort", sp.sort)
    params.set("page", String(p))
    return `/products?${params.toString()}`
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          {sp.q ? `Results for "${sp.q}"` : "All products"}
        </h1>
        <span className="text-muted-foreground text-sm">{total} products</span>
      </div>

      <ConnectedProductGrid
        products={products}
        columns={4}
        {...productListEmptyCopy({
          query: sp.q,
          categoryId: sp.category,
          total,
          firstPageHref: buildHref(1),
        })}
      />

      {(page > 1 || hasMore) && products.length > 0 ? (
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline" disabled={page <= 1}>
            <Link href={buildHref(page - 1)}>Previous</Link>
          </Button>
          <span className="text-muted-foreground text-sm">Page {page}</span>
          <Button asChild variant="outline" disabled={!hasMore}>
            <Link href={buildHref(page + 1)}>Next</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
