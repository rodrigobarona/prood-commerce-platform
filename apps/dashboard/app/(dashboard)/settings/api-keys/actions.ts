"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { getAuth } from "@/lib/auth/server"
import { requireActiveOrg } from "@/lib/admin"
import { revokeActiveOrgApiKey } from "@/lib/api-keys"

export interface ApiKeyActionState {
  key?: string
  error?: string
}

export async function createApiKeyAction(
  _state: ApiKeyActionState,
  formData: FormData
): Promise<ApiKeyActionState> {
  const name = String(formData.get("name") ?? "").trim()
  const scopes = formData
    .getAll("scopes")
    .map(String)
    .filter((scope) => scope === "storefront" || scope === "admin")

  if (!name) return { error: "API key name is required." }
  if (scopes.length === 0) return { error: "Select at least one scope." }

  const orgId = await requireActiveOrg()
  const result = await getAuth().api.createApiKey({
    headers: await headers(),
    body: {
      name,
      prefix: "pk",
      organizationId: orgId,
      metadata: {
        organizationId: orgId,
        scopes,
      },
    },
  })

  const key = (result as { key?: string }).key
  revalidatePath("/settings/api-keys")
  return key ? { key } : { error: "API key was created, but no secret was returned." }
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await revokeActiveOrgApiKey(id)
  revalidatePath("/settings/api-keys")
}
