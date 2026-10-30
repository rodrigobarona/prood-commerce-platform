// ---------------------------------------------------------------------------
// Required configuration
// ---------------------------------------------------------------------------
// Pass the env reference itself (`requiredEnv(process.env.NEXT_PUBLIC_X, ...)`)
// so Next.js can still inline NEXT_PUBLIC_* values into client bundles.

/** Return a trimmed env value, or throw a clear error when it is missing. */
export function requiredEnv(value: string | undefined, name: string): string {
  const trimmed = value?.trim()
  if (!trimmed) throw new Error(`${name} is required`)
  return trimmed
}

/**
 * Public origin of a store's slug subdomain, derived from the storefront base
 * URL: `https://prood.app` → `https://acme.prood.app`,
 * `http://localhost:3000` → `http://acme.localhost:3000`.
 */
export function storeOriginForSlug(storefrontUrl: string, slug: string): string {
  const url = new URL(storefrontUrl)
  url.hostname = `${slug}.${url.hostname}`
  return url.origin
}
