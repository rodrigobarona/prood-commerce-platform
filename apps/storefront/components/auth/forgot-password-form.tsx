"use client"

import { useState } from "react"
import Link from "next/link"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { FieldError } from "@/components/auth/field-error"
import { authClient } from "@/lib/auth/client"
import { focusFirstError, resetLinkErrors, type AuthErrors } from "@/lib/auth/form-errors"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<AuthErrors>({})
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = resetLinkErrors(email)
    setFieldErrors(found)
    if (focusFirstError(found)) return

    setLoading(true)
    setError(null)

    const { error: resetError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message ?? "We couldn't send the link. Try again in a moment.")
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          If an account with that email exists, we&apos;ve sent a password reset link.
          Check your inbox.
        </p>
        <Link href="/login" className="text-foreground w-fit text-sm underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    )
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
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <CommerceButton type="submit" className="mt-1" disabled={loading}>
        {loading ? "Sending..." : "Send reset link"}
      </CommerceButton>
      <p className="text-muted-foreground text-center text-sm">
        Remember your password?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  )
}
