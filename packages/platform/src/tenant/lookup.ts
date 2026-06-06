import { neon } from "@neondatabase/serverless"

const sql = neon(
  process.env.DATABASE_URL ??
    "postgresql://placeholder:placeholder@localhost:5432/placeholder",
)

const RESERVED_STORE_SLUGS = new Set(["www", "api", "dashboard", "pay", "docs"])

function isAllowedStoreSlug(slug: string): boolean {
  return slug.length > 0 && !RESERVED_STORE_SLUGS.has(slug)
}

/** Resolve a request host to an organization (tenant) id. */
export async function lookupTenantByHost(
  host: string,
  platformDomain?: string,
): Promise<string | null> {
  try {
    const domainRows = (await sql`
      SELECT organization_id FROM tenant_domain
      WHERE domain = ${host} AND verified = true
      LIMIT 1
    `) as { organization_id: string }[]
    if (domainRows[0]?.organization_id) return domainRows[0].organization_id

    if (!platformDomain) {
      console.warn(`[tenant] NEXT_PUBLIC_PLATFORM_DOMAIN not set, cannot resolve subdomain`)
      return null
    }

    if (host === platformDomain) {
      return null
    }

    if (host.endsWith(`.${platformDomain}`)) {
      const slug = host.slice(0, host.length - platformDomain.length - 1)
      if (isAllowedStoreSlug(slug)) {
        const orgRows = (await sql`
          SELECT id FROM organization WHERE slug = ${slug} LIMIT 1
        `) as { id: string }[]
        if (orgRows[0]?.id) return orgRows[0].id
        console.warn(`[tenant] slug "${slug}" not found in organization table`)
      } else {
        console.warn(`[tenant] slug "${slug}" is reserved`)
      }
    } else {
      if (!host.endsWith(".vercel.app")) {
        console.warn(`[tenant] host "${host}" does not match *.${platformDomain}`)
      }
    }
  } catch (err) {
    console.error(`[tenant] lookup failed for host "${host}":`, err)
    return null
  }
  return null
}
