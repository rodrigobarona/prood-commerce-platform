import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { LoginForm } from "@/components/auth/login-form"
import { getSession } from "@/lib/auth"
import { isPasskeyEnabled } from "@prood/auth/passkey-config"

export const metadata = { title: "Sign in" }

async function LoginGate() {
  const session = await getSession()
  if (session) redirect("/")
  return <LoginForm passkeys={isPasskeyEnabled()} />
}

export default function LoginPage() {
  return (
    <AuthPage image="keys-door" line="Open your store. Keep the keys.">
      <Suspense fallback={<AuthFormSkeleton />}>
        <LoginGate />
      </Suspense>
    </AuthPage>
  )
}
