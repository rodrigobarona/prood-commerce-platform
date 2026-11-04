"use server"

import { revalidatePath } from "next/cache"
import { APIError } from "better-auth/api"
import { headers } from "next/headers"
import { getEntitlements } from "@prood/billing"
import { getAuth } from "@/lib/auth/server"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"
import { ADMIN_SCOPE_NEEDS_GROW } from "@/lib/api-key-copy"
import { revokeActiveOrgApiKey } from "@/lib/api-keys"
import { revokeStoreAgent } from "@/lib/agents"
import { getActiveOrganizationPlan } from "@/lib/billing"

export interface ApiKeyActionState {
  key?: string
  error?: string
  /** Shown beside the field instead, and focused. */
  nameError?: string
  scopesError?: string
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

  const nameError = name ? undefined : "This key needs a name, so you can tell it apart later."
  const scopesError = scopes.length > 0 ? undefined : "This key needs a scope. Choose Storefront, Admin or both."
  if (nameError || scopesError) return { nameError, scopesError }

  const orgId = await requireStoreAdmin()
  // The API refuses every call from such a key, so it isn't worth creating.
  const plan = await getActiveOrganizationPlan()
  if (scopes.includes("admin") && !getEntitlements(plan?.planId ?? "free").apiWriteEnabled) {
    return { scopesError: ADMIN_SCOPE_NEEDS_GROW }
  }

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

export async function revokeApiKeyAction(id: string): Promise<void> {
  await revokeActiveOrgApiKey(id)
  revalidatePath("/settings/api-keys")
}

export async function revokeAgentAction(id: string): Promise<void> {
  await revokeStoreAgent(id)
  revalidatePath("/settings/api-keys")
}
