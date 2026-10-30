import { createAuthClient } from "better-auth/react"
import { requiredEnv } from "@prood/types"
import { organizationClient } from "better-auth/client/plugins"

/** Same-origin /api/auth (proxied to apps/api); the env URL is only for SSR. */
function authClientBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  return requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL")
}

/** Browser auth client — same-origin BFF at /api/auth proxies to apps/api. */
export const authClient = createAuthClient({
  baseURL: authClientBaseUrl(),
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})
