import "server-only"
import { connection } from "next/server"
import { headers } from "next/headers"
import { createCommerceApiClient } from "@prood/api-client"
import { requiredEnv } from "@prood/types"
import { normalizeHost } from "@/lib/store-host"

export function getCommerceApiBaseUrl(): string {
  return requiredEnv(process.env.COMMERCE_API_URL, "COMMERCE_API_URL")
}

/**
 * The shopper's client: forwards the store host (the API resolves the tenant
 * from it) and the shopper's cookies. For carts, orders and accounts.
 */
export async function getCommerceApi() {
  await connection()
  const headerList = await headers()
  return createCommerceApiClient({
    baseUrl: getCommerceApiBaseUrl(),
    host: normalizeHost(headerList.get("host")),
    cookie: headerList.get("cookie") ?? undefined,
  })
}

/**
 * A client that knows only which store it reads. The catalog is the same for
 * every shopper, so what it returns can be cached and shared.
 */
export function getCatalogApi(storeHost: string) {
  return createCommerceApiClient({ baseUrl: getCommerceApiBaseUrl(), host: storeHost })
}
