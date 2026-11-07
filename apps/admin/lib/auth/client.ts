import { createAuthClient } from "better-auth/react"
import { requiredEnv } from "@prood/types"
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins"

/** Same-origin /api/auth (proxied to apps/api); the env URL is only for SSR. */
function authClientBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  return requiredEnv(process.env.NEXT_PUBLIC_ADMIN_URL, "NEXT_PUBLIC_ADMIN_URL")
}

export const authClient = createAuthClient({
  baseURL: authClientBaseUrl(),
  plugins: [
    adminClient(),
    organizationClient(),
    // A password sign-in for an account with two-factor on ends in a challenge, not a session.
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.assign(`/two-factor${window.location.search}`)
      },
    }),
  ],
  fetchOptions: {
    credentials: "include",
  },
})
