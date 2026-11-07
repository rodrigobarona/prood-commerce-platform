import { createAuthClient } from "better-auth/react"
import { requiredEnv } from "@prood/types"
import { organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
import { stripeClient } from "@better-auth/stripe/client"

/**
 * Same-origin /api/auth: on prood.com the gateway sends it to apps/api, the issuer, so the session
 * cookie belongs to prood.com. The env URL only serves server rendering.
 */
function authClientBaseUrl(): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : new URL(requiredEnv(process.env.NEXT_PUBLIC_DASHBOARD_URL, "NEXT_PUBLIC_DASHBOARD_URL")).origin
  return `${origin}/api/auth`
}

/** Browser auth client, same-origin /api/auth. */
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
