"use server"

import { revalidatePath } from "next/cache"
import { isCommerceApiError } from "@prood/api-client"
import type { FulfillOrderInput } from "@prood/commerce"
import { fulfillOrder, refundOrder, cancelOrder } from "@/lib/admin-api"
import { isNextInternalError } from "@/lib/errors"

export async function fulfillOrderAction(
  id: string,
  input: FulfillOrderInput
): Promise<void> {
  await fulfillOrder(id, input)
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
}

export type RefundOrderResult = { ok: true } | { ok: false; error: string }

// Returned, not thrown: Next.js hides thrown messages from the client in production.
export async function refundOrderAction(
  id: string,
  input: { note?: string; recordOnly?: boolean }
): Promise<RefundOrderResult> {
  try {
    await refundOrder(id, input)
  } catch (err) {
    if (isNextInternalError(err)) throw err
    return {
      ok: false,
      error: isCommerceApiError(err)
        ? err.message
        : "We couldn't refund this order. Nothing changed. Try again.",
    }
  }
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
  return { ok: true }
}

/** Returns the API's refusal: a thrown message doesn't survive a server action. */
export async function cancelOrderAction(
  id: string,
  note?: string
): Promise<{ error?: string }> {
  try {
    await cancelOrder(id, note)
  } catch (err) {
    if (isCommerceApiError(err)) return { error: err.message }
    throw err
  }
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
  return {}
}
