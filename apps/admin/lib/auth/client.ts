import { createAuthClient } from "better-auth/react"
import { requiredEnv } from "@prood/types"
import { adminClient } from "better-auth/client/plugins"
import { organizationClient } from "better-auth/client/plugins"

/** Same-origin /api/auth (proxied to apps/api); the env URL is only for SSR. */
function authClientBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  return requiredEnv(process.env.NEXT_PUBLIC_ADMIN_URL, "NEXT_PUBLIC_ADMIN_URL")
}

export const authClient = createAuthClient({
  baseURL: authClientBaseUrl(),
  plugins: [adminClient(), organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
})
