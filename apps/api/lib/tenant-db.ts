import "server-only"
import { neon } from "@neondatabase/serverless"

// A placeholder keeps module evaluation safe during build without DATABASE_URL.
const sql = neon(
  process.env.DATABASE_URL ??
    "postgresql://placeholder:placeholder@localhost:5432/placeholder"
)

const RESERVED_STORE_SLUGS = new Set(["www", "api", "dashboard", "pay", "docs"])

function isAllowedStoreSlug(slug: string): boolean {
  return slug.length > 0 && !RESERVED_STORE_SLUGS.has(slug)
}

/**
 * Resolve a request host to an organization (tenant) id.
 *
 * - Custom domains map via the `tenant_domain` table (verified rows only).
 * - `{slug}.{platformDomain}` subdomains map via `organization.slug`.
 *
 * These tables are not RLS-protected (the tenant isn't known yet at this point),
 * so the lookup runs as a plain read. Returns null when no mapping exists.
 */
export async function lookupTenantByHost(
  host: string,
  platformDomain?: string
): Promise<string | null> {
  try {
    const domainRows = (await sql`
      SELECT organization_id FROM tenant_domain
      WHERE domain = ${host} AND verified = true
      LIMIT 1
    `) as { organization_id: string }[]
    if (domainRows[0]?.organization_id) return domainRows[0].organization_id

    if (platformDomain && host.endsWith(`.${platformDomain}`)) {
      const slug = host.slice(0, host.length - platformDomain.length - 1)
      if (isAllowedStoreSlug(slug)) {
        const orgRows = (await sql`
          SELECT id FROM organization WHERE slug = ${slug} LIMIT 1
        `) as { id: string }[]
        if (orgRows[0]?.id) return orgRows[0].id
      }
    }
  } catch {
    // DB unavailable or tables missing — caller decides the fallback.
  }
  return null
}
