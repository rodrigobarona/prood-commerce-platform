"use server"

import { revalidatePath } from "next/cache"
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

export async function cancelOrderAction(
  id: string,
  note?: string
): Promise<void> {
  await cancelOrder(id, note)
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
}
