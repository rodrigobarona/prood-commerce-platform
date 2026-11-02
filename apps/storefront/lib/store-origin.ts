import "server-only"
import { headers } from "next/headers"

/** This store's address, as the shopper reached it. */
export async function storeOrigin(): Promise<string> {
  const headerList = await headers()
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host")
  if (!host) throw new Error("Missing Host header")
  return `${headerList.get("x-forwarded-proto") ?? "http"}://${host}`
}
