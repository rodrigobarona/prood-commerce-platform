import { Suspense } from "react"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Sign in" }

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect("/")

  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
