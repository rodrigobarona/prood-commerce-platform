import "server-only"
import { redirect } from "next/navigation"
import type {
  CreateCategoryInput,
  CreateProductInput,
  Customer,
  DashboardStats,
  FulfillOrderInput,
  Order,
  Product,
  StoreSettings,
  UpdateCategoryInput,
  UpdateInventoryInput,
  UpdateProductInput,
  UpdateStoreInput,
} from "@prood/commerce"
import { getActiveOrganizationId } from "@/lib/auth"
import { getCommerceApi } from "@/lib/commerce-api"

async function requireOrgId(): Promise<string> {
  const orgId = await getActiveOrganizationId()
  if (!orgId) redirect("/")
  return orgId
}

async function unwrap<T>(
  promise: Promise<{ data?: unknown; error?: unknown }>
): Promise<T> {
  const { data, error } = await promise
  if (error) throw error
  if (data === undefined) throw new Error("Empty API response")
  return data as T
}

export async function listProducts(query: Record<string, string | number | undefined> = {}) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<{ items: Product[]; total: number }>(
    api.GET("/admin/products", { params: { query } })
  )
}

export async function getProduct(id: string) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<Product>(
    api.GET("/admin/products/{id}", { params: { path: { id } } })
  )
}

export async function createProduct(input: CreateProductInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<Product>(api.POST("/admin/products", { body: input }))
}

export async function updateProduct(id: string, input: UpdateProductInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(api.PATCH("/admin/products/{id}", { params: { path: { id } }, body: input }))
}

export async function deleteProduct(id: string) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(api.DELETE("/admin/products/{id}", { params: { path: { id } } }))
}

export async function createCategory(input: CreateCategoryInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(api.POST("/admin/categories", { body: input }))
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(
    api.PATCH("/admin/categories/{id}", { params: { path: { id } }, body: input })
  )
}

export async function deleteCategory(id: string) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(api.DELETE("/admin/categories/{id}", { params: { path: { id } } }))
}

export async function listOrders(query: Record<string, string | number | undefined> = {}) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<{ items: Order[]; total: number }>(
    api.GET("/admin/orders", { params: { query } })
  )
}

export async function getOrder(id: string) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<Order>(
    api.GET("/admin/orders/{id}", { params: { path: { id } } })
  )
}

export async function fulfillOrder(id: string, input: FulfillOrderInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(
    api.POST("/admin/orders/{id}/fulfill", {
      params: { path: { id } },
      body: input,
    })
  )
}

export async function refundOrder(id: string, note?: string) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(
    api.POST("/admin/orders/{id}/refund", {
      params: { path: { id } },
      body: note ? { note } : {},
    })
  )
}

export async function listCustomers(query: Record<string, string | number | undefined> = {}) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<{ items: Customer[]; total: number }>(
    api.GET("/admin/customers", { params: { query } })
  )
}

export async function getCustomer(id: string) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<Customer>(
    api.GET("/admin/customers/{id}", { params: { path: { id } } })
  )
}

export async function getStoreSettings() {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<StoreSettings>(api.GET("/admin/store"))
}

export async function updateStoreSettings(input: UpdateStoreInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(api.PATCH("/admin/store", { body: input }))
}

export async function updateInventory(input: UpdateInventoryInput) {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap(api.POST("/admin/inventory", { body: input }))
}

export async function getDashboardStats() {
  await requireOrgId()
  const api = await getCommerceApi()
  return unwrap<DashboardStats>(api.GET("/admin/dashboard"))
}
