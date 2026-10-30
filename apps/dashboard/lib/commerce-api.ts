import "server-only"
import { cache } from "react"
import { headers } from "next/headers"
import { createCommerceApiClient } from "@prood/api-client"
import { requiredEnv } from "@prood/types"

export function getCommerceApiBaseUrl(): string {
  return requiredEnv(process.env.COMMERCE_API_URL, "COMMERCE_API_URL")
}

/** Dashboard SSR client — forwards session cookie to apps/api for admin routes. */
export const getCommerceApi = cache(async function getCommerceApi() {
  const headerList = await headers()
  return createCommerceApiClient({
    baseUrl: getCommerceApiBaseUrl(),
    cookie: headerList.get("cookie") ?? undefined,
  })
})
