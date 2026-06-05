import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"

export const metadata = { title: "Reset password" }

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Reset password</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Choose a new password for your account.
      </p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
