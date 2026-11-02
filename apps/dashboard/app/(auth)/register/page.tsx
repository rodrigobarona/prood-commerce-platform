import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AuthPage } from "@/components/auth/auth-page"
import { AuthFormSkeleton } from "@/components/auth/form-skeleton"
import { RegisterForm } from "@/components/auth/register-form"
import { getSession } from "@/lib/auth"
import { isVercelConfigured } from "@/lib/vercel"

export const metadata = { title: "Create account" }

async function RegisterGate() {
  const session = await getSession()
  if (session) redirect("/")
  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <AuthPage image="street-tiles" line={
        isVercelConfigured()
          ? "Your store, on your own domain and payment accounts."
          : "Your store, on your own payment accounts."
      }>
      <Suspense fallback={<AuthFormSkeleton />}>
        <RegisterGate />
      </Suspense>
    </AuthPage>
  )
}
