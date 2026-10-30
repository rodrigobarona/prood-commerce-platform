import "server-only"
import { connection } from "next/server"
import { headers } from "next/headers"
import { createCommerceApiClient } from "@prood/api-client"
import { requiredEnv } from "@prood/types"

export function getCommerceApiBaseUrl(): string {
  return requiredEnv(process.env.COMMERCE_API_URL, "COMMERCE_API_URL")
}

/**
 * Server-side client. Forwards the store host (the API resolves the tenant
 * from it) and the shopper's cookies.
 */
export async function getCommerceApi() {
  await connection()
  const headerList = await headers()
  return createCommerceApiClient({
    baseUrl: getCommerceApiBaseUrl(),
    host: headerList.get("host")?.split(":")[0]?.toLowerCase(),
    cookie: headerList.get("cookie") ?? undefined,
  })
}
