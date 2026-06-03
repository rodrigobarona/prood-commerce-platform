import { Suspense } from "react"
import { redirect } from "next/navigation"
import { AdminLoginForm } from "@/components/auth/login-form"
import { UnauthorizedCard } from "@/components/auth/unauthorized-card"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Sign in" }

export default async function LoginPage() {
  const session = await getSession()
  if (session) {
    const role = (session.user as Record<string, unknown>).role as
      | string
      | undefined
    if (role === "admin") redirect("/")
    return (
      <Suspense>
        <UnauthorizedCard />
      </Suspense>
    )
  }

  return (
    <Suspense>
      <AdminLoginForm />
    </Suspense>
  )
}
