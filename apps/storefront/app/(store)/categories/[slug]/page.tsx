import { notFound } from "next/navigation"
import type { Category } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { fetchCategories, fetchProductList } from "@/lib/commerce-data"

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
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const category = findBySlug(await fetchCategories(), slug)
  if (!category) notFound()

  const result = await fetchProductList({
    categoryId: category.id,
    perPage: 24,
  })

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{localized(category.name)}</h1>
        {category.description ? (
          <p className="text-muted-foreground">{localized(category.description)}</p>
        ) : null}
      </div>
      <ConnectedProductGrid
        products={result.products.items}
        columns={4}
        emptyTitle="No products in this category yet"
        emptyDescription="Check back soon, or browse the rest of the store."
      />
    </div>
  )
}
