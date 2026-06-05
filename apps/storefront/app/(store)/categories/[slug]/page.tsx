import { notFound } from "next/navigation"
import type { Category, Product } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { fetchCategories, fetchProductList } from "@/lib/commerce-data"

function findBySlug(categories: Category[], slug: string): Category | null {
  for (const category of categories) {
    if (category.slug === slug) return category
    const child = findBySlug(category.children, slug)
    if (child) return child
  }
  return null
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

  let category: Category | null = null
  try {
    category = findBySlug(await fetchCategories(), slug)
  } catch {
    /* DB unavailable */
  }
  if (!category) notFound()

  let products: Product[] = []
  try {
    const result = await fetchProductList({
      categoryId: category.id,
      perPage: 24,
    })
    products = result.products.items
  } catch {
    /* DB unavailable */
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{localized(category.name)}</h1>
        {category.description ? (
          <p className="text-muted-foreground">{localized(category.description)}</p>
        ) : null}
      </div>
      <ConnectedProductGrid products={products} columns={4} />
    </div>
  )
}
