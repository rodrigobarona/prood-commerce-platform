"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { safeRedirectPath } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { FieldError } from "@prood/ui/components/field"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { PageHeader } from "@prood/ui/components/page-header"
import { PasswordInput } from "@prood/ui/components/password-input"
import { emailError } from "@prood/ui/lib/auth-fields"
import { authClient } from "@/lib/auth/client"

function signInErrorMessage(error: { code?: string; status: number }): string {
  if (error.status === 429) {
    return "We couldn't sign you in. There were too many attempts. Wait a minute and try again."
  }
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "We couldn't sign you in. That email and password don't match. Try again or reset your password."
    case "BANNED_USER":
      return "We couldn't sign you in. This account is banned. Ask another administrator to review it."
    case "INVALID_ORIGIN":
      return "We couldn't sign you in. The API doesn't trust this admin address. Add it to NEXT_PUBLIC_ADMIN_URL on the API and try again."
    default:
      return "We couldn't sign you in. Something went wrong on our side. Try again in a moment."
  }
}

export function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = safeRedirectPath(searchParams.get("redirect"))

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found = { email: emailError(email), password: password ? undefined : "Enter your password." }
    setFieldErrors(found)
    const firstInvalid = found.email ? "email" : found.password ? "password" : null
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { error: signInError } = await authClient.signIn.email({ email, password })
      if (signInError) {
        setError(signInErrorMessage(signInError))
        return
      }
      router.push(redirect)
      router.refresh()
    } catch {
      setError("We couldn't sign you in. The request didn't finish. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Sign in to Prood admin"
        description="For Prood staff. Use your administrator account."
      />
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
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError id="email-error" className="text-xs">
            {fieldErrors.email}
          </FieldError>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            required
            aria-invalid={fieldErrors.password ? true : undefined}
            aria-describedby={fieldErrors.password ? "password-error" : undefined}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError id="password-error" className="text-xs">
            {fieldErrors.password}
          </FieldError>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-pretty text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
