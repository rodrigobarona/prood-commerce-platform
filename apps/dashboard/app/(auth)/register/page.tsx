import { Suspense } from "react"
import { redirect } from "next/navigation"
import { RegisterForm } from "@/components/auth/register-form"
import { getSession } from "@/lib/auth"

export const metadata = { title: "Create account" }

export default async function RegisterPage() {
  const session = await getSession()
  if (session) redirect("/")

  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
