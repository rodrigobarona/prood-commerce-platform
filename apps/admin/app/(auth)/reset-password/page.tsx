import { Suspense } from "react"
import { LoginSkeleton } from "@/components/admin/skeletons"
import { ResetPasswordPanel } from "@/components/auth/auth-panels"

export const metadata = { title: "Choose a new password" }

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <ResetPasswordPanel />
    </Suspense>
  )
}
