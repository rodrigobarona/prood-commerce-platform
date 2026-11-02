import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AccessDenied } from "@/components/auth/access-denied"
import { AdminLoginForm } from "@/components/auth/login-form"
import { LoginSkeleton } from "@/components/admin/skeletons"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Sign in" }

async function LoginGate() {
  const session = await getSession()
  if (!session) return <AdminLoginForm />
  if (session.user.role === "admin") redirect("/")
  return <AccessDenied email={session.user.email} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginGate />
    </Suspense>
  )
}
