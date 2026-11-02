"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { FieldError } from "@/components/auth/field-error"
import { authClient } from "@/lib/auth/client"
import { focusFirstError, resetPasswordErrors, type ResetPasswordErrors } from "@/lib/auth/form-errors"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ResetPasswordErrors>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-destructive text-sm">
          This reset link isn't valid. Request a new one to choose your password.
        </p>
        <Link href="/forgot-password" className="text-foreground w-fit text-sm underline underline-offset-4">
          Request new link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const found = resetPasswordErrors(password, confirmPassword)
    setFieldErrors(found)
    if (focusFirstError(found)) return

    setLoading(true)
    setError(null)

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message ?? "We couldn't reset your password. Request a new link and try again.")
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm">
          Your password has been reset successfully. You can now sign in with your new password.
        </p>
        <Link href="/login" className="text-foreground w-fit text-sm underline underline-offset-4">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={fieldErrors.password ? true : undefined}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={fieldErrors.confirmPassword ? true : undefined}
          aria-describedby={fieldErrors.confirmPassword ? "confirmPassword-error" : undefined}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <FieldError id="confirmPassword-error" message={fieldErrors.confirmPassword} />
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <CommerceButton type="submit" className="mt-1" disabled={loading}>
        {loading ? "Resetting..." : "Reset password"}
      </CommerceButton>
    </form>
  )
}
