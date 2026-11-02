import { Suspense } from "react"
import { AuthPage } from "@/components/auth/auth-page"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata = { title: "Forgot password" }

export default function ForgotPasswordPage() {
  return (
    <AuthPage
      title="Forgot password"
      description="Enter your email and we'll send you a link to reset your password."
    >
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </AuthPage>
  )
}
