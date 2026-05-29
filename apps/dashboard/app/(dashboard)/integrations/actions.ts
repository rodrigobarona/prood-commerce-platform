"use server"

import { revalidatePath } from "next/cache"
import { requireActiveOrg } from "@/lib/admin"
import {
  deleteIntegration,
  getIntegration,
  upsertIntegration,
} from "@/lib/integrations"
import { getProvider } from "@/lib/providers"

export async function saveIntegrationAction(
  provider: string,
  config: Record<string, string>,
  enabled: boolean
): Promise<void> {
  const meta = getProvider(provider)
  if (!meta) throw new Error("Unknown provider")

  const orgId = await requireActiveOrg()
  const existing = await getIntegration(orgId, provider)

  // Merge submitted values over existing config, keeping only known fields.
  // Empty submitted fields preserve the stored value (so secrets the form
  // never echoes back aren't wiped on save).
  const merged: Record<string, string> = {}
  for (const field of meta.fields) {
    const submitted = config[field.key]?.trim()
    const prior = existing?.config[field.key]
    const value = submitted || prior
    if (value) merged[field.key] = value
  }

  await upsertIntegration(orgId, provider, merged, enabled)
  revalidatePath("/integrations")
  revalidatePath(`/integrations/${provider}`)
}

export async function disconnectIntegrationAction(
  provider: string
): Promise<void> {
  const orgId = await requireActiveOrg()
  await deleteIntegration(orgId, provider)
  revalidatePath("/integrations")
  revalidatePath(`/integrations/${provider}`)
}
