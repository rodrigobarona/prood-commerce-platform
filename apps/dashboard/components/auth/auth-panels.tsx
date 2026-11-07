"use client"

import { passwordResetPanels } from "@prood/ui/components/password-reset-forms"
import { twoFactorPanel } from "@prood/ui/components/two-factor-form"
import { authClient } from "@/lib/auth/client"

// The screens use this app's auth client, which calls /api/auth on prood.com.

export const TwoFactorPanel = twoFactorPanel(authClient.twoFactor)

const passwordReset = passwordResetPanels(authClient, "/reset-password")
export const ForgotPasswordPanel = passwordReset.ForgotPasswordPanel
export const ResetPasswordPanel = passwordReset.ResetPasswordPanel
