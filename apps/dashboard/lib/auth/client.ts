import { createAuthClient } from "better-auth/react"
import { requiredEnv } from "@prood/types"
import { organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
import { stripeClient } from "@better-auth/stripe/client"

/** Same-origin /api/auth (proxied to apps/api); the env URL is only for SSR. */
function authClientBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  return requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL")
}

/** Browser auth client — same-origin BFF at /api/auth proxies to apps/api. */
export const authClient = createAuthClient({
  baseURL: authClientBaseUrl(),
  plugins: [
    organizationClient(),
    // The routes only exist when the API has passkeys configured. The UI checks the same switch.
    passkeyClient(),
    stripeClient({ subscription: true }),
    // A password sign-in for an account with two-factor on ends in a challenge, not a session.
    // /login's own query (`?redirect=`) goes along, so the person lands where they were headed.
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
