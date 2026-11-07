"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"
import { ADMIN_ONLY_MESSAGE, canManageStore } from "@/lib/admin"
import { getCommerceApiBaseUrl } from "@/lib/commerce-api"

/**
 * Erases one shopper from the store. The API route checks who is asking again, and refuses
 * anything but a signed-in owner or admin. Returns the refusal, since a thrown message
 * doesn't survive a server action.
 */
export async function eraseCustomerAction(
  customerId: string,
  scrubOrders: boolean
): Promise<{ error?: string }> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }
  const res = await fetch(`${getCommerceApiBaseUrl()}/api/store/customers/${encodeURIComponent(customerId)}`, {
    method: "DELETE",
    headers: { cookie: (await headers()).get("cookie") ?? "", "content-type": "application/json" },
    body: JSON.stringify({ scrubOrders }),
    cache: "no-store",
  })
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null
    return { error: body?.error ?? body?.message ?? "We couldn't erase this customer. Nothing changed." }
  }
  revalidatePath("/customers")
  return {}
}
