import "server-only"
import type { Product } from "@prood/types"
import { getCategories, getProducts } from "@/lib/catalog"
import { storeOrigin } from "@/lib/store-host"

/** The API's largest page. */
const API_PAGE = 100
/** Products per sitemap file: a few API pages, so a big store never needs one huge request. */
export const PRODUCTS_PER_SITEMAP = 500

const PRODUCT_FILE = /^products-(\d+)\.xml$/

export interface SitemapEntry {
  path: string
  lastModified?: string
  image?: string
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`)
}

function xml(body: string): Response {
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}`, {
    headers: { "content-type": "application/xml; charset=utf-8" },
  })
}

/** `/sitemap.xml`: an index of the store's pages, then its products in files of 500. */
export async function sitemapIndex(storeHost: string): Promise<Response> {
  const origin = storeOrigin(storeHost)
  const { products } = await getProducts(storeHost, { perPage: 1 })
  const files = Math.ceil(products.total / PRODUCTS_PER_SITEMAP)
  const names = ["pages.xml", ...Array.from({ length: files }, (_, i) => `products-${i + 1}.xml`)]
  return xml(
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${names
      .map((name) => `  <sitemap><loc>${escapeXml(`${origin}/sitemap/${name}`)}</loc></sitemap>`)
      .join("\n")}\n</sitemapindex>`,
  )
}

async function productsForFile(storeHost: string, file: number): Promise<Product[]> {
  const pagesPerFile = PRODUCTS_PER_SITEMAP / API_PAGE
  const first = (file - 1) * pagesPerFile + 1
  const { products } = await getProducts(storeHost, { page: first, perPage: API_PAGE })
  const last = Math.min(first + pagesPerFile - 1, Math.ceil(products.total / API_PAGE))
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, last - first) }, (_, i) =>
      getProducts(storeHost, { page: first + i + 1, perPage: API_PAGE }),
    ),
  )
  return [products, ...rest.map((page) => page.products)].flatMap((page) => page.items)
}

/** The entries of one sitemap file, or null when there's no such file. */
export async function sitemapEntries(storeHost: string, name: string): Promise<SitemapEntry[] | null> {
  if (name === "pages.xml") {
    const categories = await getCategories(storeHost)
    return [{ path: "/" }, { path: "/products" }, ...categories.map((c) => ({ path: `/categories/${c.slug}` }))]
  }
  const file = Number(PRODUCT_FILE.exec(name)?.[1])
  if (!Number.isSafeInteger(file) || file < 1) return null
  const products = await productsForFile(storeHost, file)
  if (products.length === 0) return null
  return products.map((product) => ({
    path: `/products/${product.slug}`,
    lastModified: product.updatedAt,
    image: product.primaryImage?.url,
  }))
}

export function sitemapFile(storeHost: string, entries: SitemapEntry[]): Response {
  const origin = storeOrigin(storeHost)
  const urls = entries.map((entry) => {
    const parts = [`<loc>${escapeXml(`${origin}${entry.path}`)}</loc>`]
    if (entry.lastModified) parts.push(`<lastmod>${escapeXml(entry.lastModified)}</lastmod>`)
    if (entry.image) parts.push(`<image:image><image:loc>${escapeXml(entry.image)}</image:loc></image:image>`)
    return `  <url>${parts.join("")}</url>`
  })
  return xml(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>`,
  )
}
