import "server-only"
import { headers } from "next/headers"
import { requiredEnv } from "@prood/types"

/**
 * With Cache Components the `[host]` root param needs one value at build time.
 * This one is no store's (`.invalid` never resolves) and renders as not found,
 * so a build needs neither the database nor the API. Real stores are built on
 * their first visit.
 */
export const BUILD_HOST = "build.invalid"

/** A Host header as a store host: lowercased, without its port. */
export function normalizeHost(raw: string | null | undefined): string | undefined {
  return raw?.split(":")[0]?.toLowerCase() || undefined
}

/**
 * The host of the store this request is for. Pages read it from the `[host]`
 * root param instead; Route Handlers and Server Actions can't, so they use this.
 */
export async function requestHost(): Promise<string> {
  const host = normalizeHost((await headers()).get("host"))
  if (!host) throw new Error("Missing Host header")
  return host
}

/**
 * A store's public origin, built from its host alone so cached pages can use
 * it. Protocol and port come from the storefront's own URL: `https` in
 * production, `http://…:3000` locally.
 */
export function storeOrigin(host: string): string {
  const base = new URL(requiredEnv(process.env.NEXT_PUBLIC_STOREFRONT_URL, "NEXT_PUBLIC_STOREFRONT_URL"))
  return `${base.protocol}//${host}${base.port ? `:${base.port}` : ""}`
}
