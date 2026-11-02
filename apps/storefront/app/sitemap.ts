import type { MetadataRoute } from "next"
import { fetchCategories, fetchProductList } from "@/lib/commerce-data"
import { storeOrigin } from "@/lib/store-origin"
import { resolveTenantId } from "@/lib/tenant"

const PER_PAGE = 100

async function allProductSlugs(): Promise<string[]> {
  const slugs: string[] = []
  for (let page = 1; ; page += 1) {
    const { products } = await fetchProductList({ page, perPage: PER_PAGE })
    slugs.push(...products.items.map((product) => product.slug))
    if (products.items.length === 0 || slugs.length >= products.total) return slugs
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await resolveTenantId()
  const [origin, categories, productSlugs] = await Promise.all([
    storeOrigin(),
    fetchCategories(),
    allProductSlugs(),
  ])

  return [
    "/",
    "/products",
    ...categories.map((category) => `/categories/${category.slug}`),
    ...productSlugs.map((slug) => `/products/${slug}`),
  ].map((path) => ({ url: `${origin}${path}` }))
}
