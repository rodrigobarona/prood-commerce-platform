"use server"

import { revalidatePath } from "next/cache"
import { isCommerceApiError } from "@prood/api-client"
import type { FulfillOrderInput } from "@prood/commerce"
import { fulfillOrder, refundOrder, cancelOrder } from "@/lib/admin-api"

export async function fulfillOrderAction(
  id: string,
  input: FulfillOrderInput
): Promise<void> {
  await fulfillOrder(id, input)
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
}

export async function refundOrderAction(
  id: string,
  note?: string
): Promise<void> {
  await refundOrder(id, note)
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
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
