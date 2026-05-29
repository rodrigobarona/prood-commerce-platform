import { RegisterForm } from "@/components/auth/register-form"

export const metadata = { title: "Create account" }

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Create account</h1>
      <RegisterForm />
    </div>
  )
}
