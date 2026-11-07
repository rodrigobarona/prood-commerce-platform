import "server-only"
import { cache } from "react"
import { headers } from "next/headers"
import { createCommerceApiClient } from "@prood/api-client"
import { requiredEnv } from "@prood/types"

export function getCommerceApiBaseUrl(): string {
  return requiredEnv(process.env.COMMERCE_API_URL, "COMMERCE_API_URL")
}

/**
 * The API's origin, for the session-only routes that live outside `/v1` (`/api/account/export`,
 * `/api/store/export`, `/api/store/customers/{id}`). COMMERCE_API_URL is the `/v1` base the
 * client uses, so those routes can't be built by appending to it.
 */
export function getCommerceApiOrigin(): string {
  return new URL(getCommerceApiBaseUrl()).origin
}

/** Dashboard SSR client — forwards session cookie to apps/api for admin routes. */
export const getCommerceApi = cache(async function getCommerceApi() {
  const headerList = await headers()
  return createCommerceApiClient({
    baseUrl: getCommerceApiBaseUrl(),
    cookie: headerList.get("cookie") ?? undefined,
  })
})
