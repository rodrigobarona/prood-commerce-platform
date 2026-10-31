import Image from "next/image"
import Link from "next/link"
import { HeroBanner } from "@prood/ui/components/hero-banner"
import { localized } from "@prood/ui/lib/commerce"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import {
  fetchCategories,
  fetchProductList,
  fetchStoreInfo,
} from "@/lib/commerce-data"

export default async function HomePage() {
  // A failure here belongs in error.tsx: rendered as empty, it reads as a store
  // with nothing to sell.
  const [productList, categories, store] = await Promise.all([
    fetchProductList({ perPage: 8 }),
    fetchCategories(),
    fetchStoreInfo(),
  ])
  const products = productList.products.items

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-14 px-4 py-8">
      <HeroBanner
        title={`Welcome to ${localized(store.name)}`}
        subtitle={store.description ? localized(store.description) : undefined}
        primaryLabel="Shop now"
        primaryHref="/products"
        secondaryLabel="Browse categories"
        secondaryHref="/products"
      />

      {categories.length > 0 ? (
        <section className="flex flex-col gap-5">
          <h2 className="text-2xl font-bold tracking-tight">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group/cat bg-muted relative flex aspect-square items-end overflow-hidden rounded-2xl p-3"
              >
                {category.image ? (
                  <Image
                    src={category.image.url}
                    alt={category.image.alt || localized(category.name)}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover transition-transform duration-300 group-hover/cat:scale-105"
                  />
                ) : null}
                <span className="bg-background/80 relative rounded-lg px-2 py-1 text-sm font-medium">
                  {localized(category.name)}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Featured products</h2>
          <Link href="/products" className="text-sm hover:underline">
            View all
          </Link>
        </div>
        <ConnectedProductGrid products={products} columns={4} />
      </section>
    </div>
  )
}
