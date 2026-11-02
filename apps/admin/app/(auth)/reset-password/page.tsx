import { Suspense } from "react"
import { LoginSkeleton } from "@/components/admin/skeletons"
import { ResetPasswordPanel } from "@prood/auth/password-reset-panels"

export const metadata = { title: "Choose a new password" }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <ResetPasswordPanel />
    </Suspense>
  )
}
