import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/client"

export interface CreateAppAuthClientOptions {
  baseURL?: string
  plugins?: BetterAuthClientPlugin[]
}

/**
 * Browser auth client pointed at the central API origin (`NEXT_PUBLIC_AUTH_URL`).
 * Safe to import in Client Components.
 */
export function createAppAuthClient(options: CreateAppAuthClientOptions = {}) {
  const baseURL =
    options.baseURL?.trim() ??
    process.env.NEXT_PUBLIC_AUTH_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim() ??
    (process.env.NEXT_PHASE === "phase-production-build"
      ? "http://localhost:3005"
      : undefined)

  if (!baseURL) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_URL (or NEXT_PUBLIC_API_URL) is required for auth client"
    )
  }

  return createAuthClient({
    baseURL,
    plugins: options.plugins ?? [],
    fetchOptions: {
      credentials: "include",
    },
  })
}
