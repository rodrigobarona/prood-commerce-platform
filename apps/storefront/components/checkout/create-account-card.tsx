"use client"

import { useState } from "react"
import { UserPlus } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
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
        setError(signUpError.message ?? "Could not create account")
      }
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
        <p className="font-medium text-emerald-700 dark:text-emerald-300">
          Account created! You can now track your orders from your account page.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border p-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="size-5 text-primary" weight="bold" />
        <h2 className="font-semibold">Save your details for next time</h2>
      </div>
      <p className="text-muted-foreground mb-4 text-sm">
        Create an account to track your orders, speed up future checkouts, and manage your addresses.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="create-email">Email</Label>
          <Input
            id="create-email"
            type="email"
            value={email}
            disabled
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="create-password">Choose a password</Label>
          <Input
            id="create-password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            className="mt-1"
          />
        </div>
        {error ? <p className="text-destructive text-sm">{error}</p> : null}
        <Button type="submit" disabled={loading || password.length < 8}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </div>
  )
}
