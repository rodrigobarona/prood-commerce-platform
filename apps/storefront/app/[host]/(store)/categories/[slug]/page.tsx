import { localized } from "@prood/ui/lib/commerce"
import { CategoryPageContent, CollectionFrame, findBySlug } from "@/components/commerce/collection-page"
import { fetchCategories } from "@/lib/commerce-data"
import { pageAlternates } from "@/lib/store-metadata"

export async function generateMetadata({ params }: PageProps<"/[host]/categories/[slug]">) {
  const { slug } = await params
  try {
    const category = findBySlug(await fetchCategories(), slug)
    if (category) return { title: localized(category.name), alternates: pageAlternates(`/categories/${category.slug}`) }
  } catch {
    /* ignore */
  }
  return { title: "Category" }
}

export default function CategoryPage({ params, searchParams }: PageProps<"/[host]/categories/[slug]">) {
  return (
    <CollectionFrame>
      <CategoryPageContent slug={params.then((p) => p.slug)} searchParams={searchParams} />
    </CollectionFrame>
  )
}
