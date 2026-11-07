/** A public base URL from env, without a trailing slash. */
export function publicUrl(value: string | undefined, name: string): string {
  if (!value) throw new Error(`${name} is required`)
  return value.replace(/\/$/, "")
}

/**
 * Canonical origin for metadata, the sitemap and structured data. Everything
 * Prood serves shares one domain, so this is the same origin as the API.
 */
export const docsOrigin = publicUrl(process.env.NEXT_PUBLIC_DOCS_URL, "NEXT_PUBLIC_DOCS_URL")

/** What the docs OG images print as their address, e.g. `prood.com/docs`. */
export const docsHost = `${new URL(docsOrigin).host}/docs`

export const docsRoute = "/docs"
/** Interactive API reference (Fumadocs OpenAPI). */
export const docsApiRoute = `${docsRoute}/api`
export const docsImageRoute = `${docsRoute}/og`
export const docsContentRoute = "/llms.mdx/docs"

export const gitConfig = {
  user: "rodrigobarona",
  repo: "prood-commerce-platform",
  branch: "main",
}
