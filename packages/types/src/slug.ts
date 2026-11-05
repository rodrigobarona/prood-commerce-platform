/** Subdomains of the storefront domain that can never be store slugs. */
export const RESERVED_STORE_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'dashboard', 'docs', 'checkout', 'pay',
  'mail', 'status', 'help', 'support', 'blog', 'cdn', 'assets', 'static',
])

/** The longest store slug: one DNS label holds 63 characters, and addresses stay readable well under that. */
export const MAX_STORE_SLUG_LENGTH = 48

/** What a finished store slug looks like: lowercase words joined by single hyphens. */
export const STORE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A URL-safe slug: accents go, so "Grés" is `gres`, not `gr-s`. */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
