import Image from "next/image"
import { host } from "next/root-params"
import { FULL_BLEED_SIZES, getImage } from "@prood/media"
import { MediaImage } from "@prood/media/image"
import type { Category, Image as ImageType, Product } from "@prood/types"
import { HeroBanner } from "@prood/ui/components/hero-banner"
import { localized } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"
import { CategoryTiles, type CategoryTile } from "@/components/commerce/category-tiles"
import { EditorialPair } from "@/components/commerce/editorial-pair"
import { ConnectedProductGrid } from "@/components/commerce/connected-product-grid"
import { SectionHeader } from "@/components/commerce/section-header"
import { StoreIntro } from "@/components/commerce/store-intro"
import { StoreStory } from "@/components/commerce/store-story"
import { Container } from "@/components/layout/container"
import { JsonLd } from "@/components/layout/json-ld"
import {
  fetchCategories,
  fetchProductList,
  fetchStoreInfo,
} from "@/lib/commerce-data"
import { storeJsonLd } from "@/lib/json-ld"
import { storeArt, type StoreArt } from "@/lib/store-art"
import { storeOrigin } from "@/lib/store-host"
import { pageAlternates } from "@/lib/store-metadata"
import { resolveTenantId } from "@/lib/tenant"

export const metadata = { alternates: pageAlternates("/") }

const MAX_TILES = 4
/** Fewer photographed products than this get larger cards, rather than a thin row of small ones. */
const MIN_FULL_ROW = 4
/** Longer than this, a description is too much for the display line. */
const HEADLINE_MAX = 90

/** A category shows its own image, or else a photo of something it sells. */
async function categoryTile(category: Category, art: StoreArt | null): Promise<CategoryTile> {
  const photo = art?.tiles[category.slug]
  if (photo) return { category, image: getImage(photo) }
  if (category.image) return { category, image: category.image }
  const list = await fetchProductList({ categoryId: category.id, perPage: 1 })
  return { category, image: list.products.items[0]?.primaryImage ?? null }
}

/** The store's own photography: a category's image, or its first product's. */
function heroImage(tiles: CategoryTile[], products: Product[]): ImageType | null {
  const fromCategory = tiles.find((tile) => tile.category.image)?.category.image
  return fromCategory ?? products.find((product) => product.primaryImage)?.primaryImage ?? null
}

export default async function HomePage() {
  // A failure here belongs in error.tsx: rendered as empty, it reads as a store
  // with nothing to sell.
  const [productList, categories, store, tenantId, storeHost] = await Promise.all([
    fetchProductList({ perPage: 8 }),
    fetchCategories(),
    fetchStoreInfo(),
    resolveTenantId(),
    host(),
  ])
  const products = productList.products.items
  const art = storeArt(tenantId)
  const tiles = await Promise.all(
    categories.slice(0, MAX_TILES).map((category) => categoryTile(category, art)),
  )

  const image = art ? null : heroImage(tiles, products)
  const name = localized(store.name)
  const description = store.description ? localized(store.description) : ""
  const proposition = description.length > 0 && description.length <= HEADLINE_MAX
  // Under the store's own name, saying it again in the next heading adds nothing.
  const named = !art && !image
  // With nothing to add to the name in the header, the page opens on what's for sale.
  const bare = named && !description
  const onlyCategory = categories.length === 1 ? categories[0] : null
  // Larger cards only help a photograph. Without one they're just more grey.
  const photographed = products.some((product) => product.primaryImage)

  return (
    <>
      <JsonLd data={storeJsonLd(store, storeOrigin(storeHost))} />
      {bare ? (
        <h1 className="sr-only">{name}</h1>
      ) : named ? (
        <StoreIntro name={name} description={description} />
      ) : (
        <HeroBanner
          title={art?.headline ?? (proposition ? description : name)}
          subtitle={art || proposition ? undefined : description || undefined}
          primaryLabel="Browse products"
          primaryHref="/products"
          media={
            art ? (
              <MediaImage slug={art.hero} fill preload sizes={FULL_BLEED_SIZES} className="object-cover" />
            ) : image ? (
              <Image src={image.url} alt={image.alt ?? ""} fill preload sizes="100vw" className="object-cover" />
            ) : undefined
          }
        />
      )}

      {tiles.length > 0 ? (
        <section>
          <Container
            className={cn("flex flex-col gap-6 pb-16 md:gap-8 md:pb-24", bare ? "pt-10 md:pt-14" : "pt-16 md:pt-24")}
          >
            <SectionHeader title={art?.categories.title ?? (named ? "Browse by category" : `Browse ${name}`)} text={art?.categories.text} />
            <CategoryTiles tiles={tiles} />
          </Container>
        </section>
      ) : null}

      <section>
        <Container className={cn("flex flex-col gap-6 pb-16 md:gap-8 md:pb-24", tiles.length === 0 && "pt-10 md:pt-14")}>
          {products.length > 0 ? (
            <SectionHeader
              title={
                art?.featured.title ??
                (onlyCategory ? localized(onlyCategory.name) : named ? "Latest products" : `Latest from ${name}`)
              }
              text={art?.featured.text}
              href="/products"
              linkLabel="View all products"
            />
          ) : null}
          <ConnectedProductGrid
            products={art ? products.slice(0, 4) : products}
            columns={photographed && products.length < MIN_FULL_ROW ? 3 : 4}
          />
        </Container>
      </section>

      {art && products.length > 4 ? (
        <>
          <section>
            <EditorialPair
              title={art.pairing.title}
              text={art.pairing.text}
              link={art.pairing.link}
              lead={
                <MediaImage
                  slug={art.pairing.lead}
                  fill
                  sizes="(min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              }
              inset={
                <MediaImage
                  slug={art.pairing.inset}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover"
                />
              }
            />
          </section>
          <section>
            <Container className="flex flex-col gap-6 pt-16 pb-16 md:gap-8 md:pt-24 md:pb-24">
              <SectionHeader title={art.more.title} />
              <ConnectedProductGrid products={products.slice(4)} columns={4} />
            </Container>
          </section>
        </>
      ) : null}

      {art ? (
        <StoreStory
          title={art.story.title}
          text={art.story.text}
          link={art.story.link}
          media={
            <MediaImage
              slug={art.story.photo}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          }
        />
      ) : null}
    </>
  )
}
