import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientPlugin } from "better-auth/client"

export interface CreateAppAuthClientOptions<
  Plugins extends BetterAuthClientPlugin[] = BetterAuthClientPlugin[],
> {
  plugins?: Plugins
}

export type AppAuthClient = ReturnType<typeof createAuthClient>

export function resolveAuthClientBaseUrl(): string {
  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL?.trim()
  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  let baseURL = authUrl ?? apiUrl

  // Dashboard has no /api/auth handler — misconfigured env often points here.
  if (baseURL && dashboardUrl && baseURL === dashboardUrl && apiUrl) {
    baseURL = apiUrl
  }

  if (!baseURL) {
    throw new Error(
      "NEXT_PUBLIC_AUTH_URL (or NEXT_PUBLIC_API_URL) is required (e.g. http://localhost:3005 in dev)."
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
