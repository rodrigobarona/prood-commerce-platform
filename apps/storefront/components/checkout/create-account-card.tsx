"use client"

import { useState } from "react"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { signUp } from "@/lib/auth/client"

interface CreateAccountCardProps {
  email: string
  name?: string
}

export function CreateAccountCard({ email, name }: CreateAccountCardProps) {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: signUpError } = await signUp.email({
      name: name || email.split("@")[0] || "Customer",
      email,
      password,
    })

    setLoading(false)
    if (signUpError) {
      if (signUpError.message?.includes("already exists")) {
        setError("An account with this email already exists. You can log in from the account page.")
      } else {
        setError(signUpError.message ?? "We couldn't create your account. Try again in a moment.")
      }
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <p role="status" className="bg-muted/50 rounded-xl p-5 text-sm">
        Account created. Confirm your email. If this order isn&apos;t in your account, contact the store with its number.
      </p>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border p-5">
      <div className="flex flex-col gap-1">
        <h2 className="font-sans text-base font-medium">Follow your orders</h2>
        <p className="text-muted-foreground text-sm">
          Create an account to see your orders in one place.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 [&_[data-slot=input]]:h-11">
        {/* The address this order used, not a field to fill in. Password managers still need to see it. */}
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <p className="flex flex-wrap gap-x-2 text-sm">
          <span className="text-muted-foreground">Account email</span>
          <span className="min-w-0 break-all">{email}</span>
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="create-password">Choose a password</Label>
          <Input
            id="create-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-describedby="create-password-hint"
            required
          />
          <p id="create-password-hint" className="text-muted-foreground text-sm">
            At least 8 characters.
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <CommerceButton type="submit" disabled={loading || password.length < 8}>
          {loading ? "Creating account..." : "Create account"}
        </CommerceButton>
      </form>
    </section>
  )
}
