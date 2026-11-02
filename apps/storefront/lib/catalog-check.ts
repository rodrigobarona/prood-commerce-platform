import { createCommerceApiClient } from "@prood/api-client"
import { lookupTenantByHost } from "@prood/platform"
import { requiredEnv } from "@prood/types"
import { DEMO_POLICIES } from "@/lib/demo-policies"
import { isDemoStore } from "@/lib/demo-store"

const CATALOG_PAGE = /^\/(products|categories)\/([^/]+)$/
const POLICY_PAGE = /^\/policies\/([^/]+)$/

/** Every document waits on this, so a stalled API costs this much and no more. */
const LOOKUP_TIMEOUT_MS = 1500
/** Long enough to spare the API on a busy page, short enough that a new product soon shows. */
const CACHE_MS = 30_000
const MAX_ENTRIES = 1000

const answers = new Map<string, { value: unknown; expires: number }>()

/** `undefined` means the lookup didn't settle it, which isn't worth remembering. */
async function remembered<T>(key: string, load: () => Promise<T | undefined>): Promise<T | undefined> {
  const hit = answers.get(key)
  if (hit && hit.expires > Date.now()) return hit.value as T

  const value = await load()
  if (value === undefined) return undefined
  if (answers.size >= MAX_ENTRIES) answers.clear()
  answers.set(key, { value, expires: Date.now() + CACHE_MS })
  return value
}

/**
 * Whether a product or category page has nothing to show. Pages stream from a
 * 200, so only a check made before rendering can return a real 404. A lookup
 * that fails or times out says nothing about the page, which then deals with it.
 * The API has no way to ask after one category, so each host's list of slugs is
 * remembered instead of being fetched for every page.
 */
export async function isMissingCatalogPage(pathname: string, host: string | undefined): Promise<boolean> {
  const match = CATALOG_PAGE.exec(pathname)
  const slug = match?.[2]
  if (!slug) return false

  try {
    const name = decodeURIComponent(slug)
    const api = createCommerceApiClient({ baseUrl: requiredEnv(process.env.COMMERCE_API_URL, "COMMERCE_API_URL"), host })
    const signal = () => AbortSignal.timeout(LOOKUP_TIMEOUT_MS)

    if (match[1] === "products") {
      const missing = await remembered(`product:${host}:${name}`, async () => {
        const { response } = await api.GET("/products/by-slug/{slug}", { params: { path: { slug: name } }, signal: signal() })
        if (response.status === 404) return true
        return response.ok ? false : undefined
      })
      return missing ?? false
    }

    const slugs = await remembered(`categories:${host}`, async () => {
      const { data } = await api.GET("/categories", { params: { query: {} }, signal: signal() })
      return data?.map((category) => category.slug)
    })
    return slugs ? !slugs.includes(name) : false
  } catch {
    return false
  }
}

/** Whether this host is the demo store, the only one with policy pages. `undefined` if that can't be told. */
async function isDemoHost(host: string, platformDomain: string): Promise<boolean | undefined> {
  const tenantId = await Promise.race([
    lookupTenantByHost(host, platformDomain),
    new Promise<undefined>((resolve) => setTimeout(resolve, LOOKUP_TIMEOUT_MS)),
  ])
  // An unknown host belongs to the page, which sends it to the marketing site.
  return tenantId ? isDemoStore(tenantId) : undefined
}

/**
 * Whether a policy page has nothing to show: no store has this one, or this
 * store has none. Decided here for the same reason as a catalog page, and with
 * the same rule when a lookup doesn't settle it.
 */
export async function isMissingPolicyPage(pathname: string, host: string | undefined): Promise<boolean> {
  const slug = POLICY_PAGE.exec(pathname)?.[1]
  if (!slug) return false

  try {
    const name = decodeURIComponent(slug)
    if (!DEMO_POLICIES.some((policy) => policy.slug === name)) return true

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN
    if (!host || !platformDomain) return false
    const demo = await remembered(`demo:${host}`, () => isDemoHost(host, platformDomain))
    return demo === false
  } catch {
    return false
  }
}
