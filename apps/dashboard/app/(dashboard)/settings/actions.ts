"use server"

import { revalidatePath } from "next/cache"
import { isCommerceApiError } from "@prood/api-client"
import type { UpdateStoreInput } from "@prood/commerce"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"
import { getCurrentUser } from "@/lib/auth"
import { updateStoreSettings } from "@/lib/admin-api"
import { isDomainClaimed, listDomains } from "@/lib/domains"
import { removeProjectDomain } from "@/lib/vercel"

/** Returns the API's refusal: a thrown message doesn't survive a server action. */
export async function updateStoreSettingsAction(
  input: Omit<UpdateStoreInput, "locale">
): Promise<{ error?: string }> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }
  try {
    await updateStoreSettings(input)
  } catch (err) {
    if (isCommerceApiError(err)) {
      return { error: err.errors?.[0]?.message ?? err.message }
    }
    throw err
  }
  revalidatePath("/settings")
  return {}
}

/** The store's custom domains, read before it is deleted: the rows go with the store, the Vercel entries don't. */
export async function listStoreDomainsAction(): Promise<string[]> {
  const orgId = await requireStoreAdmin()
  return (await listDomains(orgId)).map((row) => row.domain)
}

/**
 * Takes a deleted store's custom domains off the storefront project. A domain is only
 * removed once no store claims it any more, so this can't pull one that is in use.
 */
export async function removeDeletedStoreDomainsAction(domains: string[]): Promise<void> {
  if (!(await getCurrentUser())) return
  for (const domain of domains) {
    if (await isDomainClaimed(domain)) continue
    await removeProjectDomain(domain).catch((err) => console.error(`[store-delete] domain ${domain}`, err))
  }
}
