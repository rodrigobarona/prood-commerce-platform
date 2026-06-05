import { Suspense } from "react"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata = { title: "Forgot password" }

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Forgot password</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  )
}
