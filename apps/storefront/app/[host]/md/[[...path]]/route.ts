import { localized } from "@prood/ui/lib/commerce"
import { getCategories, getProductBySlug, getProducts, getStore } from "@/lib/catalog"
import { catalogMarkdown, categoryMarkdown, homeMarkdown, productMarkdown } from "@/lib/markdown"
import { storeOrigin } from "@/lib/store-host"
import { tenantIdForHost } from "@/lib/tenant"

const CATALOG_LIMIT = 100

async function render(storeHost: string, path: string[], origin: string): Promise<string | null> {
  const [section, slug, ...rest] = path
  if (rest.length > 0) return null

  if (!section) {
    const [store, categories, { products }] = await Promise.all([
      getStore(storeHost),
      getCategories(storeHost),
      getProducts(storeHost, { perPage: 12 }),
    ])
    return homeMarkdown(store, categories, products.items, origin)
  }
  if (section === "products" && !slug) {
    const [store, { products }] = await Promise.all([getStore(storeHost), getProducts(storeHost, { perPage: CATALOG_LIMIT })])
    return catalogMarkdown(localized(store.name), products.items, products.total, origin)
  }
  if (section === "products" && slug) {
    const product = await getProductBySlug(storeHost, slug)
    return product ? productMarkdown(product, origin) : null
  }
  if (section === "categories" && slug) {
    const category = (await getCategories(storeHost)).find((c) => c.slug === slug)
    if (!category) return null
    const { products } = await getProducts(storeHost, { categoryId: category.id, perPage: CATALOG_LIMIT })
    return categoryMarkdown(category, products.items, origin)
  }
  return null
}

/**
 * The Markdown version of a store page, reached through `proxy.ts` from the
 * page's `.md` URL or an `Accept: text/markdown` request. It points back to
 * the HTML page, which is the one search engines should index.
 */
export async function GET(_request: Request, { params }: RouteContext<"/[host]/md/[[...path]]">) {
  const { host, path = [] } = await params
  const origin = storeOrigin(host)
  const body = (await tenantIdForHost(host)) ? await render(host, path.map(decodeURIComponent), origin) : null
  const page = `${origin}/${path.join("/")}`
  if (!body) return new Response("Not found\n", { status: 404, headers: { "content-type": "text/markdown; charset=utf-8" } })
  return new Response(body, {
    headers: {
      "content-type": "text/markdown; charset=utf-8",
      "x-robots-tag": "noindex",
      link: `<${page}>; rel="canonical"`,
      vary: "accept",
    },
  })
}
