"use server"

import { revalidatePath } from "next/cache"
import { isCommerceApiError } from "@prood/api-client"
import type { UpdateStoreInput } from "@prood/commerce"
import { ADMIN_ONLY_MESSAGE, canManageStore } from "@/lib/admin"
import { updateStoreSettings } from "@/lib/admin-api"

/** Returns the API's refusal: a thrown message doesn't survive a server action. */
export async function updateStoreSettingsAction(
  input: UpdateStoreInput
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
