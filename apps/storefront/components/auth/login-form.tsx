"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { safeRedirectPath } from "@prood/types"
import { FieldError } from "@/components/auth/field-error"
import { signIn } from "@/lib/auth/client"
import { focusFirstError, signInErrors, type AuthErrors } from "@/lib/auth/form-errors"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirectPath(searchParams.get("redirect"), "/account")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<AuthErrors>({})
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = signInErrors({ email, password })
    setFieldErrors(found)
    if (focusFirstError(found)) return

    setLoading(true)
    setError(null)
    const { error: signInError } = await signIn.email({ email, password })
    setLoading(false)
    if (signInError) {
      setError(signInError.message ?? "We couldn't sign you in. Check your details and try again.")
      return
    }
    router.push(redirect)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-muted-foreground text-sm underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
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
        {loading ? "Signing in..." : "Sign in"}
      </CommerceButton>
      <p className="text-muted-foreground text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-foreground underline underline-offset-4">
          Create one
        </Link>
      </p>
    </form>
  )
}
