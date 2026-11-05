// schema.org descriptions of pages, for search engines and answer engines.

export type JsonLdThing = Record<string, unknown>

export const SCHEMA_CONTEXT = "https://schema.org"

/** Serialized for a `<script type="application/ld+json">`, which must not be able to close itself. */
export function jsonLdScript(data: JsonLdThing | JsonLdThing[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

/** The trail from the top down to a page: `[name, path]` pairs. */
export function breadcrumbJsonLd(trail: [string, string][], origin: string): JsonLdThing {
  return {
    "@context": SCHEMA_CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([name, path], index) => ({
      "@type": "ListItem",
      position: index + 1,
      name,
      item: `${origin}${path}`,
    })),
  }
}
