import { organizationClient } from "better-auth/client/plugins"
import { getAppAuthClient } from "@prood/auth/client"

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

function client() {
  return getAppAuthClient({
    plugins: [organizationClient()],
    resolveDevBrowserUrl: resolveDevBrowserAuthUrl,
  })
}

export function signIn(...args: Parameters<ReturnType<typeof client>["signIn"]>) {
  return client().signIn(...args)
}

export function signUp(...args: Parameters<ReturnType<typeof client>["signUp"]>) {
  return client().signUp(...args)
}

export function signOut(...args: Parameters<ReturnType<typeof client>["signOut"]>) {
  return client().signOut(...args)
}

export function useSession(
  ...args: Parameters<ReturnType<typeof client>["useSession"]>
) {
  return client().useSession(...args)
}

export const organization = new Proxy({} as ReturnType<typeof client>["organization"], {
  get(_target, prop) {
    const org = client().organization
    const value = org[prop as keyof typeof org]
    return typeof value === "function"
      ? (value as (...a: never[]) => unknown).bind(org)
      : value
  },
})
