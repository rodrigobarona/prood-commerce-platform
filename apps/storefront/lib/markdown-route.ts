/** Where the Markdown versions of pages are rendered, under the store's host. */
export const MARKDOWN_PREFIX = "/md"

/** Pages with a Markdown version: home, the catalog, a product, a category. */
const READABLE = /^\/(?:products(?:\/[^/]+)?|categories\/[^/]+)?$/

/** Whether the client's first choice is Markdown, as agents ask for it. */
function prefersMarkdown(accept: string | null): boolean {
  return accept?.split(",")[0]?.split(";")[0]?.trim().toLowerCase() === "text/markdown"
}

/**
 * The Markdown route for a request, or null to serve HTML. Agents get it by
 * adding `.md` to a page's URL (`/index.md` for the home page), or by asking
 * for `text/markdown` first.
 */
export function markdownPath(pathname: string, accept: string | null): string | null {
  const page = pathname.endsWith(".md") ? pathname.slice(0, -3).replace(/^\/index$/, "/") : null
  const target = page ?? (prefersMarkdown(accept) ? pathname : null)
  if (target === null || !READABLE.test(target)) return null
  return `${MARKDOWN_PREFIX}${target === "/" ? "" : target}`
}

/** The URL of a page's Markdown version. */
export function markdownHref(pagePath: string): string {
  return pagePath === "/" ? "/index.md" : `${pagePath}.md`
}
