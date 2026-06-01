import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/client"
import {
  resolvePublicAuthBaseUrl,
  type ResolvePublicAuthBaseUrlOptions,
} from "./public-auth-url"

export interface CreateAppAuthClientOptions extends ResolvePublicAuthBaseUrlOptions {
  baseURL?: string
  plugins?: BetterAuthClientPlugin[]
}

type AuthClient = ReturnType<typeof createAuthClient>

let cachedClient: AuthClient | undefined

/**
 * Browser auth client pointed at the central API origin (`NEXT_PUBLIC_AUTH_URL`).
 * Safe to import in Client Components.
 */
export function getAppAuthClient(
  options: CreateAppAuthClientOptions = {}
): AuthClient {
  if (cachedClient) return cachedClient

  const baseURL =
    options.baseURL?.trim() ??
    resolvePublicAuthBaseUrl({
      resolveDevBrowserUrl: options.resolveDevBrowserUrl,
    })

  cachedClient = createAuthClient({
    baseURL,
    plugins: options.plugins ?? [],
    fetchOptions: {
      credentials: "include",
    },
  })

  return cachedClient
}

/** @deprecated Prefer `getAppAuthClient()` — kept for one-off construction. */
export function createAppAuthClient(options: CreateAppAuthClientOptions = {}) {
  return getAppAuthClient(options)
}

export {
  resolvePublicAuthBaseUrl,
  resolveServerPublicAuthBaseUrl,
} from "./public-auth-url"
