import "server-only"
import type {
  Cart,
  Category,
  Order,
  PaginatedResult,
  Product,
  SearchResult,
  StoreInfo,
} from "@prood/types"
import { isCommerceApiError, unwrap } from "@prood/api-client"
import { getCommerceApi } from "@/lib/commerce-api"

export async function fetchProductList(
  query: Record<string, string | number | undefined> = {}
): Promise<SearchResult> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/products", { params: { query } }))
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const api = await getCommerceApi()
  try {
    return await unwrap(
      api.GET("/products/by-slug/{slug}", { params: { path: { slug } } })
    )
  } catch (err) {
    if (isCommerceApiError(err) && err.code === "NOT_FOUND") return null
    throw err
  }
}

export async function fetchCategories(
  query: Record<string, string | number | undefined> = {}
): Promise<Category[]> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/categories", { params: { query } }))
}

export async function fetchStoreInfo(): Promise<StoreInfo> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/store"))
}

export async function fetchCart(id: string): Promise<Cart> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/carts/{id}", { params: { path: { id } } }))
}

export async function createCartRemote(): Promise<Cart> {
  const api = await getCommerceApi()
  return unwrap(api.POST("/carts"))
}

export async function fetchOrder(id: string): Promise<Order> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/orders/{id}", { params: { path: { id } } }))
}

export async function fetchCustomerOrders(
  query: Record<string, string | number | undefined> = {}
): Promise<PaginatedResult<Order>> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/orders", { params: { query } }))
}
