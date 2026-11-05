import "server-only"
import { host } from "next/root-params"
import type { Cart, Category, Order, PaginatedResult, Product, SearchResult, StorefrontStore } from "@prood/types"
import { unwrap } from "@prood/api-client"
import { getCategories, getProductBySlug, getProducts, getStore, type ProductQuery } from "@/lib/catalog"
import { getCommerceApi } from "@/lib/commerce-api"

// Catalog reads for the store being rendered, cached per store.

export async function fetchProductList(query: ProductQuery = {}): Promise<SearchResult> {
  return getProducts(await host(), query)
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  return getProductBySlug(await host(), slug)
}

export async function fetchCategories(): Promise<Category[]> {
  return getCategories(await host())
}

export async function fetchStoreInfo(): Promise<StorefrontStore> {
  return getStore(await host())
}

// The shopper's own data, read at request time with their cookies.

export async function fetchCart(id: string): Promise<Cart> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/carts/{id}", { params: { path: { id } } }))
}

export async function createCartRemote(): Promise<Cart> {
  const api = await getCommerceApi()
  return unwrap(api.POST("/carts"))
}

export async function fetchOrder(id: string, email?: string): Promise<Order> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/orders/{id}", { params: { path: { id }, query: { email } } }))
}

export async function fetchCustomerOrders(
  query: Record<string, string | number | undefined> = {}
): Promise<PaginatedResult<Order>> {
  const api = await getCommerceApi()
  return unwrap(api.GET("/orders", { params: { query } }))
}
