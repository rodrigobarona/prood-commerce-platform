import { createAuthClient } from "better-auth/react"
import { adminClient } from "better-auth/client/plugins"
import { organizationClient } from "better-auth/client/plugins"

function resolveAdminAuthClientBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL?.trim()
  if (adminUrl) return adminUrl

  return "http://localhost:3006"
}

export const authClient = createAuthClient({
  baseURL: resolveAdminAuthClientBaseUrl(),
  plugins: [adminClient(), organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})
