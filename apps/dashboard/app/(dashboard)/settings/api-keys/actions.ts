"use server"

import { revalidatePath } from "next/cache"
import { APIError } from "better-auth/api"
import { headers } from "next/headers"
import { getAuth } from "@/lib/auth/server"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"
import { revokeActiveOrgApiKey } from "@/lib/api-keys"

export interface ApiKeyActionState {
  key?: string
  error?: string
}

export async function createApiKeyAction(
  _state: ApiKeyActionState,
  formData: FormData
): Promise<ApiKeyActionState> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }

  const name = String(formData.get("name") ?? "").trim()
  const scopes = formData
    .getAll("scopes")
    .map(String)
    .filter((scope) => scope === "storefront" || scope === "admin")

  if (!name) return { error: "API key name is required." }
  if (scopes.length === 0) return { error: "Select at least one scope." }

  const orgId = await requireStoreAdmin()
  try {
    const result = await getAuth().api.createApiKey({
      headers: await headers(),
      body: { name, prefix: "pk", organizationId: orgId, metadata: { scopes } },
    })
    revalidatePath("/settings/api-keys")
    return { key: result.key }
  } catch (err) {
    if (err instanceof APIError) return { error: err.message }
    throw err
  }
}

export async function revokeApiKeyAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "")
  if (!id) return
  await revokeActiveOrgApiKey(id)
  revalidatePath("/settings/api-keys")
}
