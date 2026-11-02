"use server"

import { revalidatePath } from "next/cache"
import { getEntitlements } from "@prood/billing"
import { requireStoreAdmin } from "@/lib/admin"
import { normalizeDomain } from "@/lib/domain-input"
import { domainLimitMessage, getActiveOrganizationPlan } from "@/lib/billing"
import {
  createDomainRow,
  deleteDomainRow,
  findDomain,
  listDomains,
  setDomainDnsRecords,
  setDomainVerified,
} from "@/lib/domains"
import {
  ensureProjectDomain,
  isVercelConfigured,
  removeProjectDomain,
  verifyProjectDomain,
  type DomainVerification,
} from "@/lib/vercel"

/** The limit comes back as a value: a thrown message doesn't survive a server action. */
export async function addDomainAction(
  domain: string
): Promise<DomainVerification | { limit: string } | { invalid: string }> {
  const orgId = await requireStoreAdmin()
  const parsed = normalizeDomain(domain)
  if ("error" in parsed) return { invalid: parsed.error }
  if (!isVercelConfigured()) return { invalid: "We can't connect domains yet. Your store stays on its Prood address." }

  const plan = await getActiveOrganizationPlan()
  const limits = getEntitlements(plan?.planId ?? "free")
  const domains = await listDomains(orgId)
  if (limits.maxCustomDomains !== null && domains.length >= limits.maxCustomDomains) {
    return { limit: domainLimitMessage(limits.maxCustomDomains) }
  }

  const result = await ensureProjectDomain(parsed.domain)
  const id = await createDomainRow(orgId, parsed.domain, result.instructions)
  if (result.verified) {
    await setDomainVerified(orgId, id, true)
  }
  revalidatePath("/domains")
  return result
}

export async function verifyDomainAction(
  id: string
): Promise<DomainVerification> {
  const orgId = await requireStoreAdmin()
  const row = await findDomain(orgId, id)
  if (!row) throw new Error("Domain not found")
  const result = await verifyProjectDomain(row.domain)
  await setDomainDnsRecords(orgId, id, result.instructions)
  await setDomainVerified(orgId, id, result.verified)
  revalidatePath("/domains")
  return result
}

export async function removeDomainAction(id: string): Promise<void> {
  const orgId = await requireStoreAdmin()
  const row = await findDomain(orgId, id)
  if (!row) return
  await removeProjectDomain(row.domain)
  await deleteDomainRow(orgId, id)
  revalidatePath("/domains")
}
