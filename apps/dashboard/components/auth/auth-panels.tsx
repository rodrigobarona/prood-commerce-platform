"use client"

import { passwordResetPanels } from "@prood/ui/components/password-reset-forms"
import { twoFactorPanel } from "@prood/ui/components/two-factor-form"
import { authClient } from "@/lib/auth/client"
import { withBase } from "@/lib/base-path"

// The screens use this app's auth client, so their requests go to its own /api/auth under the base path.

export const TwoFactorPanel = twoFactorPanel(authClient.twoFactor)

const passwordReset = passwordResetPanels(authClient, withBase("/reset-password"))
export const ForgotPasswordPanel = passwordReset.ForgotPasswordPanel
export const ResetPasswordPanel = passwordReset.ResetPasswordPanel
