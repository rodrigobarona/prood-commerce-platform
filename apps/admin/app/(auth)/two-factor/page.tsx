import { Suspense } from "react"
import { redirect } from "next/navigation"
import { TwoFactorPanel } from "@/components/auth/auth-panels"
import { LoginSkeleton } from "@/components/admin/skeletons"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Two-factor authentication" }

async function TwoFactorGate() {
  const session = await getSession()
  // Signed in already: the login page opens admin, or says the account can't.
  if (session) redirect(session.user.role === "admin" ? "/" : "/login")
  return <TwoFactorPanel />
}

export default function TwoFactorPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <TwoFactorGate />
    </Suspense>
  )
}
