import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { host } from "next/root-params"
import type { Category } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { Skeleton } from "@prood/ui/components/skeleton"
import { localized } from "@prood/ui/lib/commerce"
import { CollectionHeader } from "@/components/commerce/collection-header"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { ProductGridSkeleton } from "@/components/commerce/product-grid-skeleton"
import { SortSelect } from "@/components/commerce/sort-select"
import { Container } from "@/components/layout/container"
import { JsonLd } from "@prood/ui/components/json-ld"
import { fetchCategories, fetchProductList } from "@/lib/commerce-data"
import { breadcrumbJsonLd } from "@prood/ui/lib/json-ld"
import { collectionJsonLd } from "@/lib/json-ld"
import { productListEmptyCopy } from "@/lib/product-empty-copy"
import { parseSort } from "@/lib/product-sort"
import { storeOrigin } from "@/lib/store-host"

const FRAME = "flex flex-col gap-8 py-10 md:gap-12 md:py-16"
const PER_PAGE = 12
const CATEGORY_PER_PAGE = 24

export function findBySlug(categories: Category[], slug: string): Category | null {
  return categories.find((category) => category.slug === slug) ?? null
}

/** Shaped like a collection, so nothing moves when its products arrive. */
export function CollectionSkeleton() {
  return (
    <>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="h-9 w-full max-w-md rounded-full" />
      </div>
      <ProductGridSkeleton />
    </>
  )
}

/** The page's frame, which needs no data, around what does. */
export function CollectionFrame({ children }: { children: React.ReactNode }) {
  return (
    <Container className={FRAME}>
      <Suspense fallback={<CollectionSkeleton />}>{children}</Suspense>
    </Container>
  )
}

export interface ProductsSearchParams {
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

export async function ProductsPageContent({ searchParams }: { searchParams: Promise<ProductsSearchParams> }) {
  const sp = await searchParams
  const page = parsePage(sp.page)
  const sort = parseSort(sp.sort)
  const [result, categories] = await Promise.all([
    fetchProductList({
      query: sp.q,
      categoryId: sp.category,
      page,
      perPage: PER_PAGE,
      sortField: sort?.field,
      sortDirection: sort?.direction,
    }),
    fetchCategories(),
  ])
  const products = result.products.items
  const total = result.products.total

  const hasMore = page * PER_PAGE < total
  const buildHref = (p: number) => {
    const params = new URLSearchParams()
    if (sp.q) params.set("q", sp.q)
    if (sp.category) params.set("category", sp.category)
    if (sp.sort) params.set("sort", sp.sort)
    params.set("page", String(p))
    return `/products?${params.toString()}`
  }

  return (
    <>
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
    </>
  )
}

export async function CategoryPageContent({
  slug,
  searchParams,
}: {
  slug: Promise<string>
  searchParams: Promise<{ sort?: string }>
}) {
  const [categorySlug, { sort: sortParam }, categories, storeHost] = await Promise.all([
    slug,
    searchParams,
    fetchCategories(),
    host(),
  ])
  const category = findBySlug(categories, categorySlug)
  if (!category) notFound()

  const sort = parseSort(sortParam)
  const result = await fetchProductList({
    categoryId: category.id,
    perPage: CATEGORY_PER_PAGE,
    sortField: sort?.field,
    sortDirection: sort?.direction,
  })
  const origin = storeOrigin(storeHost)
  const name = localized(category.name)

  return (
    <>
      <JsonLd
        data={[
          collectionJsonLd(category, result.products.items, origin),
          breadcrumbJsonLd(
            [
              ["Products", "/products"],
              [name, `/categories/${category.slug}`],
            ],
            origin,
          ),
        ]}
      />
      <CollectionHeader
        title={name}
        description={category.description ? localized(category.description) : undefined}
        count={result.products.total}
        categories={categories}
        activeSlug={category.slug}
      >
        <Suspense fallback={null}>
          <SortSelect />
        </Suspense>
      </CollectionHeader>
      <ConnectedProductGrid
        products={result.products.items}
        columns={4}
        preloadCount={4}
        emptyTitle="No products in this category yet"
        emptyDescription="Check back soon, or browse the rest of the store."
        emptyActionLabel="Browse products"
        emptyActionHref="/products"
      />
    </>
  )
}
