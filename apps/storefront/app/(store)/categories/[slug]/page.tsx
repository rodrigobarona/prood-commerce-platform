import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Category } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { CollectionHeader } from "@/components/commerce/collection-header"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { SortSelect } from "@/components/commerce/sort-select"
import { Container } from "@/components/layout/container"
import { fetchCategories, fetchProductList } from "@/lib/commerce-data"
import { parseSort } from "@/lib/product-sort"

function findBySlug(categories: Category[], slug: string): Category | null {
  return categories.find((category) => category.slug === slug) ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  try {
    const category = findBySlug(await fetchCategories(), slug)
    if (category) return { title: localized(category.name) }
  } catch {
    /* ignore */
  }
  return { title: "Category" }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { slug } = await params
  const sort = parseSort((await searchParams).sort)

  const categories = await fetchCategories()
  const category = findBySlug(categories, slug)
  if (!category) notFound()

  const result = await fetchProductList({
    categoryId: category.id,
    perPage: 24,
    sortField: sort?.field,
    sortDirection: sort?.direction,
  })

  return (
    <Container className="flex flex-col gap-8 py-10 md:gap-12 md:py-16">
      <CollectionHeader
        title={localized(category.name)}
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
    </Container>
  )
}
