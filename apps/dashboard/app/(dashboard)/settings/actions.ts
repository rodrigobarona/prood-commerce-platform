"use server"

import { revalidatePath } from "next/cache"
import { isCommerceApiError } from "@prood/api-client"
import type { UpdateStoreInput } from "@prood/commerce"
import { updateStoreSettings } from "@/lib/admin-api"

/** Returns the API's refusal: a thrown message doesn't survive a server action. */
export async function updateStoreSettingsAction(
  input: UpdateStoreInput
): Promise<{ error?: string }> {
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
