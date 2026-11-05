const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL
if (!docsUrl) throw new Error("NEXT_PUBLIC_DOCS_URL is required")

/** Canonical origin for metadata, sitemap, robots and structured data. */
export const docsOrigin = docsUrl.replace(/\/$/, "")

export const docsRoute = "/docs"
/** Interactive API reference (Fumadocs OpenAPI). */
export const docsApiRoute = `${docsRoute}/api`
export const docsImageRoute = "/og/docs"
export const docsContentRoute = "/llms.mdx/docs"

export const gitConfig = {
  user: "rodrigobarona",
  repo: "prood-commerce-platform",
  branch: "main",
}
