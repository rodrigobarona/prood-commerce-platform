"use server"

import { revalidatePath } from "next/cache"
import { isCommerceApiError } from "@prood/api-client"
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@prood/commerce"
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/admin-api"
import { ADMIN_ONLY_MESSAGE, canManageStore, requireStoreAdmin } from "@/lib/admin"

/** Returned, not thrown: Next.js hides thrown messages from the client in production. */
async function refusal(run: () => Promise<unknown>): Promise<{ error?: string }> {
  if (!(await canManageStore())) return { error: ADMIN_ONLY_MESSAGE }
  try {
    await run()
    return {}
  } catch (err) {
    if (isCommerceApiError(err)) return { error: err.errors?.[0]?.message ?? err.message }
    throw err
  }
}

export async function createProductAction(input: CreateProductInput): Promise<{ error?: string }> {
  const result = await refusal(() => createProduct(input))
  revalidatePath("/products")
  return result
}

export async function updateProductAction(
  id: string,
  input: UpdateProductInput
): Promise<{ error?: string }> {
  const result = await refusal(() => updateProduct(id, input))
  revalidatePath("/products")
  revalidatePath(`/products/${id}/edit`)
  return result
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireStoreAdmin()
  await deleteProduct(id)
  revalidatePath("/products")
}
