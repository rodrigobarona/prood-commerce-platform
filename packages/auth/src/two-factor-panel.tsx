"use client"

import { createAuthClient } from "better-auth/react"
import { twoFactorClient } from "better-auth/client/plugins"
import { twoFactorPanel, type TwoFactorClient } from "@prood/ui/components/two-factor-form"

/** Each app serves /api/auth on its own origin, and these only run in the browser. */
function sameOriginClient(): TwoFactorClient {
  return createAuthClient({
    baseURL: window.location.origin,
    plugins: [twoFactorClient()],
    fetchOptions: { credentials: "include" },
  }).twoFactor
}

const client: TwoFactorClient = {
  verifyTotp: (input) => sameOriginClient().verifyTotp(input),
  verifyBackupCode: (input) => sameOriginClient().verifyBackupCode(input),
}

/** The merchant dashboard's second step. A merchant can trust their own browser for 30 days. */
export const TwoFactorPanel = twoFactorPanel(client, { offerTrustDevice: true })

/** The admin app's second step. Staff enter a code every time they sign in. */
export const StaffTwoFactorPanel = twoFactorPanel(client, { offerTrustDevice: false })
