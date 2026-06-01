import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"
import { getAppAuthClient } from "@prood/auth/client"

function makeDashboardAuthClient(baseURL: string) {
  return createAuthClient({
    baseURL,
    plugins: [organizationClient()],
    fetchOptions: {
      credentials: "include",
    },
  })
}

type DashboardAuthClient = ReturnType<typeof makeDashboardAuthClient>

function resolveDevBrowserAuthUrl(): string | undefined {
  if (typeof window === "undefined" || process.env.NODE_ENV !== "development") {
    return undefined
  }

  const { protocol, hostname } = window.location
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:3005"
  }

  return `${protocol}//${hostname}:3005`
}

function client(): DashboardAuthClient {
  return getAppAuthClient({
    plugins: [organizationClient()],
    resolveDevBrowserUrl: resolveDevBrowserAuthUrl,
  }) as DashboardAuthClient
}

function lazyClientProperty<K extends keyof DashboardAuthClient>(
  key: K
): DashboardAuthClient[K] {
  return new Proxy(function () {} as DashboardAuthClient[K], {
    get(_target, prop) {
      const value = client()[key]
      const member = (value as Record<string | symbol, unknown>)[prop]
      return typeof member === "function"
        ? member.bind(value)
        : member
    },
    apply(_target, _thisArg, args) {
      const value = client()[key]
      return (value as (...args: unknown[]) => unknown)(...args)
    },
  })
}

export const signIn = lazyClientProperty("signIn")
export const signUp = lazyClientProperty("signUp")
export const signOut = lazyClientProperty("signOut")
export const useSession = lazyClientProperty("useSession")
export const organization = lazyClientProperty("organization")
