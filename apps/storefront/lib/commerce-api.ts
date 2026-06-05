import "server-only"
import { connection } from "next/server"
import { headers } from "next/headers"
import { createCommerceApiClient } from "@prood/api-client"

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN

export function getCommerceApiBaseUrl(): string {
  return process.env.COMMERCE_API_URL ?? "http://localhost:3005/v1"
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"])

/**
 * True when the host can resolve to a storefront tenant on the API.
 * Filters out local dev hosts, the bare platform domain (no subdomain to
 * extract), and Vercel preview/deployment URLs that the API cannot resolve.
 */
function isResolvableStorefrontHost(host: string): boolean {
  if (LOCAL_HOSTS.has(host)) return false
  if (PLATFORM_DOMAIN && host.endsWith(`.${PLATFORM_DOMAIN}`)) return true
  if (host === PLATFORM_DOMAIN) return false
  if (host.endsWith(".vercel.app")) return false
  return true
}

/** Server-side client — forwards Host + cookies for tenant/session resolution on apps/api. */
export async function getCommerceApi() {
  await connection()
  const headerList = await headers()
  const rawHost = headerList.get("host")?.split(":")[0]?.toLowerCase()
  const storefrontHost =
    rawHost && isResolvableStorefrontHost(rawHost) ? rawHost : undefined
  return createCommerceApiClient({
    baseUrl: getCommerceApiBaseUrl(),
    host: storefrontHost,
    cookie: headerList.get("cookie") ?? undefined,
  })
}
