import { CommerceError } from '@prood/types'
import { neon, type NeonQueryFunction } from "@neondatabase/serverless"
import { storeOriginForSlug } from "@prood/types"

// Tenant resolution reads auth-schema tables (organization, tenant_domain),
// which are not tenant-scoped, so it uses a plain HTTP client.
let sql: NeonQueryFunction<false, false> | null = null

function db(): NeonQueryFunction<false, false> {
  if (sql) return sql
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL is required")
  sql = neon(url)
  return sql
}

/** Subdomains of the storefront domain that can never be store slugs. */
export const RESERVED_STORE_SLUGS = new Set([
  "www", "app", "api", "admin", "dashboard", "docs", "checkout", "pay",
  "mail", "status", "help", "support", "blog", "cdn", "assets", "static",
])

function slugFromHost(host: string, platformDomain: string): string | null {
  if (!host.endsWith(`.${platformDomain}`)) return null
  const slug = host.slice(0, host.length - platformDomain.length - 1)
  if (!slug || slug.includes(".") || RESERVED_STORE_SLUGS.has(slug)) return null
  return slug
}

/**
 * Resolve a request host (no port) to an organization id: a verified custom
 * domain first, then `{slug}.{platformDomain}`. Returns null when unknown.
 */
export async function lookupTenantByHost(
  host: string,
  platformDomain: string,
): Promise<string | null> {
  const domainRows = (await db()`
    SELECT organization_id FROM tenant_domain
    WHERE domain = ${host} AND verified = true
    LIMIT 1
  `) as { organization_id: string }[]
  if (domainRows[0]) return domainRows[0].organization_id

  const slug = slugFromHost(host, platformDomain)
  if (!slug) return null
  const orgRows = (await db()`
    SELECT id FROM organization WHERE slug = ${slug} LIMIT 1
  `) as { id: string }[]
  return orgRows[0]?.id ?? null
}

export interface StorefrontIdentity {
  name: string
  /** Public origin of the store, e.g. `https://acme.prood.app` or a custom domain */
  origin: string
}

/**
 * Public name and origin of a store. The origin is the primary verified custom
 * domain, or the slug subdomain of `storefrontUrl` (e.g. `https://prood.app`
 * → `https://acme.prood.app`, `http://localhost:3000` → `http://acme.localhost:3000`).
 */
export async function getStorefrontIdentity(
  organizationId: string,
  storefrontUrl: string,
): Promise<StorefrontIdentity> {
  const rows = (await db()`
    SELECT o.name, o.slug, d.domain
    FROM organization o
    LEFT JOIN LATERAL (
      SELECT domain FROM tenant_domain
      WHERE organization_id = o.id AND verified = true
      ORDER BY is_primary DESC, created_at ASC
      LIMIT 1
    ) d ON true
    WHERE o.id = ${organizationId}
  `) as { name: string; slug: string; domain: string | null }[]
  const row = rows[0]
  if (!row) throw new CommerceError(`Organization not found: ${organizationId}`, "NOT_FOUND")

  if (row.domain) return { name: row.name, origin: `https://${row.domain}` }
  return { name: row.name, origin: storeOriginForSlug(storefrontUrl, row.slug) }
}
