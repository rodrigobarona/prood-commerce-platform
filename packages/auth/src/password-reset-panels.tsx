"use client"

import { createAuthClient } from "better-auth/react"
import { passwordResetPanels } from "@prood/ui/components/password-reset-forms"

/** Each app serves /api/auth on its own origin, and these only run in the browser. */
function sameOriginClient() {
  return createAuthClient({ baseURL: window.location.origin, fetchOptions: { credentials: "include" } })
}

const panels = passwordResetPanels({
  requestPasswordReset: (input) => sameOriginClient().requestPasswordReset(input),
  resetPassword: (input) => sameOriginClient().resetPassword(input),
})

export const ForgotPasswordPanel = panels.ForgotPasswordPanel
export const ResetPasswordPanel = panels.ResetPasswordPanel
