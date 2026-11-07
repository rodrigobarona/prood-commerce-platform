"use client"

import { useState } from "react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { authClient } from "@/lib/auth/client"
import { clearDraft } from "@/lib/checkout-draft"

/** A shopper's own rights over their sign-in account: a copy of it, and deleting it. */
export function YourData() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  async function deleteAccount(): Promise<boolean> {
    setError(null)
    const { error: failure } = await authClient.deleteUser(password ? { password } : {})
    if (failure) {
      setError(failure.message ?? "We couldn't delete your account. Check your password and try again.")
      return false
    }
    clearDraft()
    window.location.assign("/")
    return true
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-sans text-base font-medium">Your data</h2>
      <p className="text-muted-foreground max-w-prose text-sm">
        Download the sign-in details we hold about you. Your orders and delivery details belong to each store you bought
        from, so ask the store for those.
      </p>
      <div>
        <Button asChild variant="outline">
          <a href="/api/account/export" download>
            Download my data
          </a>
        </Button>
      </div>
      <DangerZone
        title="Delete your account"
        description="Removes your sign-in, your sessions and the link to your orders. The stores keep their own order records."
        action={
          <ConfirmAction
            label="Delete account"
            variant="destructive"
            title="Delete your account?"
            description="This can't be undone. Stores keep the orders you placed, because they need them for their own records."
            confirmLabel="Delete account"
            onConfirm={deleteAccount}
          >
            <div className="flex flex-col gap-2">
              <Label htmlFor="delete-password">Password</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Leave this empty if you signed in within the last day.
              </p>
              {error ? (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              ) : null}
            </div>
          </ConfirmAction>
        }
      />
    </section>
  )
}
