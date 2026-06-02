import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { authDb } from "@/lib/auth/db"
import { tenantDomain } from "@/lib/auth/schema"
import type { DnsRecord } from "@/lib/dns-records"
import { ensureProjectDomain, getProjectDomain } from "@/lib/vercel"

export interface TenantDomainRow {
  id: string
  domain: string
  verified: boolean
  isPrimary: boolean
  dnsRecords: DnsRecord[]
  createdAt: Date
}

function mapRow(row: typeof tenantDomain.$inferSelect): TenantDomainRow {
  return {
    id: row.id,
    domain: row.domain,
    verified: row.verified,
    isPrimary: row.isPrimary,
    dnsRecords: row.dnsRecords ?? [],
    createdAt: row.createdAt,
  }
}

/** List a tenant's domains, newest first. Pending domains include DNS instructions. */
export async function listDomains(orgId: string): Promise<TenantDomainRow[]> {
  const rows = await authDb
    .select()
    .from(tenantDomain)
    .where(eq(tenantDomain.organizationId, orgId))
    .orderBy(desc(tenantDomain.createdAt))

  const domains = rows.map(mapRow)

  return Promise.all(
    domains.map(async (domain) => {
      if (domain.verified) return domain

      try {
        const status =
          domain.dnsRecords.length > 0
            ? await getProjectDomain(domain.domain)
            : await ensureProjectDomain(domain.domain)

        if (status.instructions.length > 0) {
          await setDomainDnsRecords(orgId, domain.id, status.instructions)
        }
        if (status.verified) {
          await setDomainVerified(orgId, domain.id, true)
        }
        return {
          ...domain,
          verified: status.verified,
          dnsRecords:
            status.instructions.length > 0
              ? status.instructions
              : domain.dnsRecords,
        }
      } catch {
        return domain
      }
    })
  )
}

/** Find one of a tenant's domains by id. */
export async function findDomain(
  orgId: string,
  id: string
): Promise<TenantDomainRow | null> {
  const [row] = await authDb
    .select()
    .from(tenantDomain)
    .where(and(eq(tenantDomain.id, id), eq(tenantDomain.organizationId, orgId)))
  return row ? mapRow(row) : null
}

/** Insert a domain row for a tenant. */
export async function createDomainRow(
  orgId: string,
  domain: string,
  dnsRecords: DnsRecord[] = []
): Promise<string> {
  const id = crypto.randomUUID()
  await authDb.insert(tenantDomain).values({
    id,
    organizationId: orgId,
    domain: domain.toLowerCase().trim(),
    dnsRecords,
  })
  return id
}

/** Delete one of a tenant's domains. */
export async function deleteDomainRow(orgId: string, id: string): Promise<void> {
  await authDb
    .delete(tenantDomain)
    .where(and(eq(tenantDomain.id, id), eq(tenantDomain.organizationId, orgId)))
}

/** Update the verified flag for one of a tenant's domains. */
export async function setDomainVerified(
  orgId: string,
  id: string,
  verified: boolean
): Promise<void> {
  await authDb
    .update(tenantDomain)
    .set({ verified })
    .where(and(eq(tenantDomain.id, id), eq(tenantDomain.organizationId, orgId)))
}

/** Persist DNS rows shown to the merchant for a pending domain. */
export async function setDomainDnsRecords(
  orgId: string,
  id: string,
  dnsRecords: DnsRecord[]
): Promise<void> {
  await authDb
    .update(tenantDomain)
    .set({ dnsRecords })
    .where(and(eq(tenantDomain.id, id), eq(tenantDomain.organizationId, orgId)))
}
