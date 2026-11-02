import { Suspense } from "react"
import { AuthPage } from "@/components/auth/auth-page"
import { LoginForm } from "@/components/auth/login-form"

export const metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <AuthPage title="Sign in">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthPage>
  )
}
