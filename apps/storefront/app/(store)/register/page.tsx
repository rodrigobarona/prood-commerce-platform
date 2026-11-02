import { AuthPage } from "@/components/auth/auth-page"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata = { title: "Create account" }

export default function RegisterPage() {
  return (
    <AuthPage title="Create account" description="Track your orders.">
      <RegisterForm />
    </AuthPage>
  )
}
