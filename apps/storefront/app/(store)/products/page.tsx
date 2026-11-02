import { Suspense } from "react"
import Link from "next/link"
import { Button } from "@prood/ui/components/button"
import { CollectionHeader } from "@/components/commerce/collection-header"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { SortSelect } from "@/components/commerce/sort-select"
import { Container } from "@/components/layout/container"
import { fetchCategories, fetchProductList } from "@/lib/commerce-data"
import { productListEmptyCopy } from "@/lib/product-empty-copy"
import { parseSort } from "@/lib/product-sort"

export const metadata = { title: "Products" }

type PageSearchParams = {
  q?: string
  category?: string
  page?: string
  sort?: string
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
  const [result, categories] = await Promise.all([
    fetchProductList({
      query: sp.q,
      categoryId: sp.category,
      page,
      perPage,
      sortField: parseSort(sp.sort)?.field,
      sortDirection: parseSort(sp.sort)?.direction,
    }),
    fetchCategories(),
  ])
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
    <Container className="flex flex-col gap-8 py-10 md:gap-12 md:py-16">
      <CollectionHeader
        title={sp.q ? `Results for \u201c${sp.q}\u201d` : "All products"}
        count={total}
        categories={sp.q ? [] : categories}
      >
        <Suspense fallback={null}>
          <SortSelect />
        </Suspense>
      </CollectionHeader>

      <ConnectedProductGrid
        products={products}
        columns={4}
        preloadCount={4}
        {...productListEmptyCopy({
          query: sp.q,
          categoryId: sp.category,
          total,
          firstPageHref: buildHref(1),
        })}
      />

      {(page > 1 || hasMore) && products.length > 0 ? (
        <nav aria-label="Pages" className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Button asChild variant="outline" size="lg">
              <Link href={buildHref(page - 1)}>Previous page</Link>
            </Button>
          ) : null}
          <span className="text-muted-foreground text-sm tabular-nums">Page {page}</span>
          {hasMore ? (
            <Button asChild variant="outline" size="lg">
              <Link href={buildHref(page + 1)}>Next page</Link>
            </Button>
          ) : null}
        </nav>
      ) : null}
    </Container>
  )
}
