import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Sign in</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
