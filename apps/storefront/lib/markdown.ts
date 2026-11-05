import type { Category, Product, StorefrontStore } from "@prood/types"
import { formatPrice, localized } from "@prood/ui/lib/commerce"
import { markdownHref } from "@/lib/markdown-route"

// Store pages as Markdown, for agents and answer engines that read text, not HTML.

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " }

/** Merchant HTML as Markdown-safe text, keeping its paragraphs and list items. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/(p|div|li|ul|ol|h[1-6])>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|apos|nbsp);/g, (_, name: string) => ENTITIES[name] ?? "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Link text can't contain the brackets that delimit it. */
function linkText(text: string): string {
  return text.replace(/[[\]]/g, "")
}

function productLine(product: Product, origin: string): string {
  const price = product.price ? ` — ${formatPrice(product.price)}` : ""
  const stock = product.inStock ? "" : " (out of stock)"
  return `- [${linkText(localized(product.name))}](${origin}${markdownHref(`/products/${product.slug}`)})${price}${stock}`
}

function categoryLine(category: Category, origin: string): string {
  const description = category.description ? `: ${htmlToText(localized(category.description)).split("\n")[0]}` : ""
  return `- [${linkText(localized(category.name))}](${origin}${markdownHref(`/categories/${category.slug}`)})${description}`
}

function section(title: string, lines: string[]): string[] {
  return lines.length > 0 ? [`## ${title}`, "", ...lines, ""] : []
}

function document(lines: string[]): string {
  return `${lines.join("\n").trim()}\n`
}

export function homeMarkdown(store: StorefrontStore, categories: Category[], products: Product[], origin: string): string {
  const description = store.description ? htmlToText(localized(store.description)) : ""
  return document([
    `# ${localized(store.name)}`,
    "",
    ...(description ? [description, ""] : []),
    ...section("Categories", categories.map((category) => categoryLine(category, origin))),
    ...section("Latest products", products.map((product) => productLine(product, origin))),
    `[All products](${origin}${markdownHref("/products")}) · [Store](${origin}/)`,
  ])
}

export function catalogMarkdown(storeName: string, products: Product[], total: number, origin: string): string {
  const more = total > products.length ? [`Showing ${products.length} of ${total}. The rest are in the [sitemap](${origin}/sitemap.xml).`, ""] : []
  return document([
    `# All products at ${storeName}`,
    "",
    ...products.map((product) => productLine(product, origin)),
    "",
    ...more,
  ])
}

export function categoryMarkdown(category: Category, products: Product[], origin: string): string {
  const description = category.description ? htmlToText(localized(category.description)) : ""
  return document([
    `# ${localized(category.name)}`,
    "",
    ...(description ? [description, ""] : []),
    ...(products.length > 0 ? products.map((product) => productLine(product, origin)) : ["No products in this category yet."]),
  ])
}

export function productMarkdown(product: Product, origin: string): string {
  const url = `${origin}/products/${product.slug}`
  const summary = localized(product.shortDescription)
  const description = htmlToText(localized(product.description))
  const facts = [
    product.price ? `- Price: ${formatPrice(product.price)}${product.vatIncluded ? " (VAT included)" : ""}` : null,
    `- Availability: ${product.inStock ? "in stock" : "out of stock"}`,
    product.sku ? `- SKU: ${product.sku}` : null,
    ...product.categories.map(
      (category) => `- Category: [${linkText(localized(category.name))}](${origin}${markdownHref(`/categories/${category.slug}`)})`,
    ),
    product.rating && product.rating.count > 0
      ? `- Rating: ${product.rating.average.toFixed(1)} out of 5, from ${product.rating.count} reviews`
      : null,
  ].filter((line): line is string => line !== null)
  const variants = product.variants.length > 1
    ? product.variants.map((variant) => {
        const name = localized(variant.name) || variant.sku || variant.id
        const price = variant.price ? ` — ${formatPrice(variant.price)}` : ""
        return `- ${name}${price}${variant.inStock ? "" : " (out of stock)"}`
      })
    : []
  const attributes = product.attributes.map((attribute) => `- ${localized(attribute.name)}: ${localized(attribute.value)}`)

  return document([
    `# ${localized(product.name)}`,
    "",
    ...(summary ? [summary, ""] : []),
    ...facts,
    "",
    ...(description && description !== summary ? [description, ""] : []),
    ...section("Options", variants),
    ...section("Details", attributes),
    ...(product.primaryImage ? [`![${linkText(product.primaryImage.alt || localized(product.name))}](${product.primaryImage.url})`, ""] : []),
    `Buy it at ${url}`,
  ])
}

export interface LlmsTxtInput {
  store: StorefrontStore
  categories: Category[]
  origin: string
  docsUrl?: string
}

/** `/llms.txt`: what the store is and where its readable pages are, per https://llmstxt.org. */
export function llmsTxt({ store, categories, origin, docsUrl }: LlmsTxtInput): string {
  const name = localized(store.name)
  const description = store.description ? htmlToText(localized(store.description)).replace(/\n+/g, " ") : ""
  return document([
    `# ${name}`,
    "",
    ...(description ? [`> ${description}`, ""] : []),
    `Every page listed here is also Markdown: add \`.md\` to a page's URL, or ask for \`text/markdown\` in the Accept header.`,
    "",
    "## Catalog",
    "",
    `- [All products](${origin}${markdownHref("/products")}): everything for sale, with prices`,
    ...categories.map((category) => categoryLine(category, origin)),
    "",
    "## Store",
    "",
    `- [Home](${origin}${markdownHref("/")})`,
    `- [Sitemap](${origin}/sitemap.xml): every product page`,
    ...(store.contactEmail ? [`- Contact: ${store.contactEmail}`] : []),
    "",
    ...(docsUrl ? ["## Optional", "", `- [Prood developer docs](${docsUrl}/llms.txt): the API this store runs on`, ""] : []),
  ])
}
