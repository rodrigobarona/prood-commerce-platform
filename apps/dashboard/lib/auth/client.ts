import { createAuthClient } from "better-auth/react"
import { organizationClient } from "better-auth/client/plugins"

function resolveDashboardAuthClientBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin

  const dashboardUrl = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim()
  if (dashboardUrl) return dashboardUrl

  return "http://localhost:3002"
}

/** Browser auth client — same-origin BFF at /api/auth proxies to apps/api. */
export const authClient = createAuthClient({
  baseURL: resolveDashboardAuthClientBaseUrl(),
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})
