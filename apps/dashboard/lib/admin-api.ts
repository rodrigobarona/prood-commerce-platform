import "server-only"
import { cache } from "react"
import type {
  CreateCategoryInput,
  CreateProductInput,
  FulfillOrderInput,
  UpdateCategoryInput,
  UpdateInventoryInput,
  UpdateProductInput,
  UpdateStoreInput,
} from "@prood/commerce"
import { unwrap } from "@prood/api-client"
import { requireActiveOrg } from "@/lib/admin"
import { getCommerceApi } from "@/lib/commerce-api"

export async function listProducts(query: Record<string, string | number | undefined> = {}) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/products", { params: { query } })
  )
}

export async function getProduct(id: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/products/{id}", { params: { path: { id } } })
  )
}

export async function createProduct(input: CreateProductInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.POST("/admin/products", { body: input }))
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.PATCH("/admin/products/{id}", { params: { path: { id } }, body: input }))
}

export async function deleteProduct(id: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.DELETE("/admin/products/{id}", { params: { path: { id } } }))
}

export async function createCategory(input: CreateCategoryInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.POST("/admin/categories", { body: input }))
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.PATCH("/admin/categories/{id}", { params: { path: { id } }, body: input })
  )
}

export async function deleteCategory(id: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.DELETE("/admin/categories/{id}", { params: { path: { id } } }))
}

export async function listOrders(query: Record<string, string | number | undefined> = {}) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/orders", { params: { query } })
  )
}

export async function getOrder(id: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/orders/{id}", { params: { path: { id } } })
  )
}

export async function fulfillOrder(id: string, input: FulfillOrderInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.POST("/admin/orders/{id}/fulfill", {
      params: { path: { id } },
      body: input,
    })
  )
}

export async function refundOrder(
  id: string,
  input: { note?: string; recordOnly?: boolean }
) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.POST("/admin/orders/{id}/refund", {
      params: { path: { id } },
      body: input,
    })
  )
}

export async function cancelOrder(id: string, note?: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.POST("/admin/orders/{id}/cancel", {
      params: { path: { id } },
      body: note ? { note } : {},
    })
  )
}

export async function getOrderHistory(id: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/orders/{id}/history", { params: { path: { id } } })
  )
}

export async function listCustomers(query: Record<string, string | number | undefined> = {}) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/customers", { params: { query } })
  )
}

export async function getCustomer(id: string) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(
    api.GET("/admin/customers/{id}", { params: { path: { id } } })
  )
}

export const getStoreSettings = cache(async function getStoreSettings() {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.GET("/admin/store"))
})

export async function updateStoreSettings(input: UpdateStoreInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.PATCH("/admin/store", { body: input }))
}

export async function updateInventory(input: UpdateInventoryInput) {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.POST("/admin/inventory", { body: input }))
}

export const getDashboardStats = cache(async function getDashboardStats() {
  await requireActiveOrg()
  const api = await getCommerceApi()
  return unwrap(api.GET("/admin/dashboard"))
})
