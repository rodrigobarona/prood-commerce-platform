"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { authClient } from "@/lib/auth/client"

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-destructive text-sm">
          Invalid or missing reset token. Please request a new password reset link.
        </p>
        <Link href="/forgot-password" className="text-foreground text-sm hover:underline">
          Request new link
        </Link>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    const { error: resetError } = await authClient.resetPassword({
      newPassword: password,
      token: token!,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message ?? "Failed to reset password")
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
        <Link href="/login" className="text-foreground text-sm hover:underline">
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          type="password"
          required
          minLength={8}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </div>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  )
}
