import { Suspense } from "react"
import { redirect } from "next/navigation"
import { TwoFactorPanel } from "@/components/auth/auth-panels"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Two-factor authentication" }

async function TwoFactorGate() {
  const session = await getSession()
  if (session) redirect("/")
  return <TwoFactorPanel />
}

export default function TwoFactorPage() {
  return (
    <AuthPage image="keys-door" line="Open your store. Keep the keys.">
      <Suspense fallback={<AuthFormSkeleton />}>
        <TwoFactorGate />
      </Suspense>
    </AuthPage>
  )
}
