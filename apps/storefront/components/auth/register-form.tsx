"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { FieldError } from "@/components/auth/field-error"
import { signUp } from "@/lib/auth/client"
import { focusFirstError, registerErrors, type AuthErrors } from "@/lib/auth/form-errors"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<AuthErrors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = registerErrors({ name, email, password })
    setFieldErrors(found)
    if (focusFirstError(found)) return

    setLoading(true)
    setError(null)
    const { error: signUpError } = await signUp.email({ name, email, password })
    setLoading(false)
    if (signUpError) {
      setError(signUpError.message ?? "We couldn't create your account. Try again in a moment.")
      return
    }
    router.push("/account")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          required
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FieldError id="name-error" message={fieldErrors.name} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FieldError id="email-error" message={fieldErrors.email} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <CommerceButton type="submit" className="mt-1" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </CommerceButton>
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  )
}
