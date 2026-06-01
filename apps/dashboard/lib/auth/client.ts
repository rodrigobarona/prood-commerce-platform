import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

function resolveAuthBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_AUTH_URL?.trim() ??
    process.env.NEXT_PUBLIC_API_URL?.trim()

  if (fromEnv) return fromEnv

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "http://localhost:3005"
  }

  // Dev fallback when accessing dashboard via Network URL (env vars still point at localhost).
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const { protocol, hostname } = window.location
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3005"
    }
    // LAN IP — API dev server listens on the same host, port 3005.
    return `${protocol}//${hostname}:3005`
  }

  throw new Error(
    "NEXT_PUBLIC_AUTH_URL (or NEXT_PUBLIC_API_URL) is required for auth client"
  )
}

/** Browser auth client — targets the central API origin. */
export const authClient = createAuthClient({
  baseURL: resolveAuthBaseUrl(),
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})

export const { signIn, signUp, signOut, useSession, organization } = authClient
