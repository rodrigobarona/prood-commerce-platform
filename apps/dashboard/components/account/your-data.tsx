"use client"

import { useState } from "react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { authClient } from "@/lib/auth/client"

/** A merchant's own rights over their account: a copy of it, and deleting it. */
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
    window.location.assign("/login")
    return true
  }

  return (
    <>
      <Panel>
        <h2 className="font-sans text-base font-medium">Your data</h2>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          A JSON file with your profile, sign-in methods, sessions, stores and agents. It leaves out your password and
          keys. Your store&apos;s own data is on the store settings page.
        </p>
        <Button asChild variant="outline" className="mt-4">
          <a href="/api/export/account" download>
            Download my data
          </a>
        </Button>
      </Panel>
      <DangerZone
        title="Delete your account"
        description="Removes your sign-in, sessions and memberships now. If you are the only owner of a store, delete the store or add another owner first. Backups age out on our database provider's schedule."
        action={
          <ConfirmAction
            label="Delete account"
            variant="destructive"
            title="Delete your account?"
            description="This can't be undone."
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
              <p className="text-xs text-muted-foreground">Leave this empty if you signed in within the last day.</p>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          </ConfirmAction>
        }
      />
    </>
  )
}
