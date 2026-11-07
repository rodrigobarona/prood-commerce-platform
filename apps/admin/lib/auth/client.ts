import { createAuthClient } from "better-auth/react"
import { requiredEnv } from "@prood/types"
import { withBase } from "@/lib/base-path"
import { passkeyClient } from "@better-auth/passkey/client"
import { adminClient, organizationClient, twoFactorClient } from "better-auth/client/plugins"

/**
 * This app's own /api/auth route (proxied to apps/api), which lives under the base path. Better
 * Auth takes a base URL with a path as it is. The env URL only serves server rendering.
 */
function authClientBaseUrl(): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : new URL(requiredEnv(process.env.NEXT_PUBLIC_ADMIN_URL, "NEXT_PUBLIC_ADMIN_URL")).origin
  return `${origin}${withBase("/api/auth")}`
}

export const authClient = createAuthClient({
  baseURL: authClientBaseUrl(),
  plugins: [
    adminClient(),
    organizationClient(),
    // The routes only exist when the API has passkeys configured. The UI checks the same switch.
    passkeyClient(),
    // A password sign-in for an account with two-factor on ends in a challenge, not a session.
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.assign(withBase(`/two-factor${window.location.search}`))
      },
    }),
  ],
  fetchOptions: {
    credentials: "include",
  },
})
