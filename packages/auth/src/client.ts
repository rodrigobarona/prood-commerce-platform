import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/client"

export interface CreateAppAuthClientOptions {
  plugins?: BetterAuthClientPlugin[]
}

export type AppAuthClient = ReturnType<typeof createAuthClient>

/** Browser auth client for apps that call the central API (`NEXT_PUBLIC_AUTH_URL`). */
export function createAppAuthClient(
  options: CreateAppAuthClientOptions = {}
): AppAuthClient {
  const baseURL = process.env.NEXT_PUBLIC_AUTH_URL?.trim()
  if (!baseURL) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_URL is required (e.g. http://localhost:3005 in dev)."
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
