"use server"

import { revalidatePath } from "next/cache"
import { getEntitlements } from "@prood/billing"
import { assertLimit } from "@prood/commerce"
import { requireActiveOrg } from "@/lib/admin"
import { getActiveOrganizationPlan } from "@/lib/billing"
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
  removeProjectDomain,
  verifyProjectDomain,
  type DomainVerification,
} from "@/lib/vercel"

export async function addDomainAction(domain: string): Promise<DomainVerification> {
  const orgId = await requireActiveOrg()
  const plan = await getActiveOrganizationPlan()
  const limits = getEntitlements(plan?.planId ?? "free")
  const domains = await listDomains(orgId)
  assertLimit(
    domains.length,
    limits.maxCustomDomains,
    "Custom domain limit reached for your plan. Upgrade to add more domains.",
  )

  const normalized = domain.toLowerCase().trim()
  const result = await ensureProjectDomain(normalized)
  const id = await createDomainRow(orgId, normalized, result.instructions)
  if (result.verified) {
    await setDomainVerified(orgId, id, true)
  }
  revalidatePath("/domains")
  return result
}

export async function verifyDomainAction(
  id: string
): Promise<DomainVerification> {
  const orgId = await requireActiveOrg()
  const row = await findDomain(orgId, id)
  if (!row) throw new Error("Domain not found")
  const result = await verifyProjectDomain(row.domain)
  await setDomainDnsRecords(orgId, id, result.instructions)
  await setDomainVerified(orgId, id, result.verified)
  revalidatePath("/domains")
  return result
}

export async function removeDomainAction(id: string): Promise<void> {
  const orgId = await requireActiveOrg()
  const row = await findDomain(orgId, id)
  if (!row) return
  await removeProjectDomain(row.domain)
  await deleteDomainRow(orgId, id)
  revalidatePath("/domains")
}
