"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { FieldError } from "@prood/ui/components/field"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { PageHeader } from "@prood/ui/components/page-header"
import { PasswordInput } from "@prood/ui/components/password-input"
import { emailError } from "@prood/ui/lib/auth-fields"
import { authClient } from "@/lib/auth/client"
import { signInErrorMessage } from "@/lib/auth/messages"
import { safeRedirectPath } from "@prood/types"

const CONTACT = "hello@prood.com"

/** Messages are plain strings; the one address in them is still a link. */
function EmailLink({ text }: { text: string }) {
  const [before, after] = text.split(CONTACT)
  if (after === undefined) return text
  return (
    <>
      {before}
      <a href={`mailto:${CONTACT}`} className="underline underline-offset-4">
        {CONTACT}
      </a>
      {after}
    </>
  )
}

export function LoginForm() {
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
      const { data, error: signInError } = await authClient.signIn.email({ email, password })
      if (signInError) {
        setError(signInErrorMessage(signInError))
        return
      }
      // The client is already sending them to /two-factor. There is no session to open yet.
      if (data && "twoFactorRedirect" in data) return
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
      <PageHeader title="Sign in" description="Your orders, products and customers are waiting." />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
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
            required
            autoComplete="current-password"
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
            <EmailLink text={error} />
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-sm text-muted-foreground">
          New to Prood?{" "}
          <Link
            href={redirect === "/" ? "/register" : `/register?redirect=${encodeURIComponent(redirect)}`}
            className="text-foreground underline underline-offset-4"
          >
            Create an account
          </Link>
        </p>
      </form>
    </div>
  )
}
