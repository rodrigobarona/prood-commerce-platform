"use server"

import { revalidatePath } from "next/cache"
import type {
  CreateProductInput,
  UpdateProductInput,
} from "@prood/commerce"
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/admin-api"
import { requireStoreAdmin } from "@/lib/admin"

export async function createProductAction(
  input: CreateProductInput
): Promise<string> {
  await requireStoreAdmin()
  const product = await createProduct(input)
  revalidatePath("/products")
  return product.id
}

export async function updateProductAction(
  id: string,
  input: UpdateProductInput
): Promise<void> {
  await requireStoreAdmin()
  await updateProduct(id, input)
  revalidatePath("/products")
  revalidatePath(`/products/${id}/edit`)
}

export async function deleteProductAction(id: string): Promise<void> {
  await requireStoreAdmin()
  await deleteProduct(id)
  revalidatePath("/products")
}
