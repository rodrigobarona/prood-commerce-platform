import { Suspense } from "react"
import { AuthPage } from "@/components/auth/auth-page"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata = { title: "Reset password" }

export default function ResetPasswordPage() {
  return (
    <AuthPage title="Reset password" description="Choose a new password for your account.">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthPage>
  )
}
