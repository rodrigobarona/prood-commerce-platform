import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/client"

export interface CreateAppAuthClientOptions<
  Plugins extends BetterAuthClientPlugin[] = BetterAuthClientPlugin[],
> {
  plugins?: Plugins
}

export type AppAuthClient = ReturnType<typeof createAuthClient>

export function resolveAuthClientBaseUrl(): string {
  const baseURL = process.env.NEXT_PUBLIC_AUTH_URL?.trim()
  if (!baseURL) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_URL is required (e.g. http://localhost:3005 in dev)."
    )
  }
  return baseURL
}

/** Browser auth client for apps that call the central API (`NEXT_PUBLIC_AUTH_URL`). */
export function createAppAuthClient<
  const Plugins extends BetterAuthClientPlugin[] = [],
>(
  options: CreateAppAuthClientOptions<Plugins> = {}
) {
  return createAuthClient({
    baseURL: resolveAuthClientBaseUrl(),
    ...(options.plugins ? { plugins: options.plugins } : {}),
    fetchOptions: {
      credentials: "include",
    },
  })
}
