import { Suspense } from "react"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { ResetPasswordPanel } from "@prood/auth/password-reset-panels"

export const metadata = { title: "Choose a new password" }

export default function ResetPasswordPage() {
  return (
    <AuthPage image="keys-door" line="Open your store. Keep the keys.">
      <Suspense fallback={<AuthFormSkeleton />}>
        <ResetPasswordPanel />
      </Suspense>
    </AuthPage>
  )
}
