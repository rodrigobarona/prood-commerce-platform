"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { formatDate } from "@/lib/format"
import { authClient } from "@/lib/auth/client"

interface Failure {
  code?: string
  status: number
}

/** The API's words are for developers. These are for the person at the dashboard. */
function addFailureMessage(failure: Failure): string {
  if (failure.code === "SESSION_NOT_FRESH") {
    return "For your security, sign in again first, then add the passkey."
  }
  if (failure.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
    return "This device already has a passkey for your account."
  }
  if (failure.code === "ERROR_CEREMONY_ABORTED" || failure.code === "NotAllowedError") {
    return "The passkey wasn't added. Try again when you're ready."
  }
  if (failure.status === 429) return "There were too many attempts. Wait a minute and try again."
  return "We couldn't add the passkey. Nothing changed. Try again."
}

/**
 * Passkeys are optional. One signs you in without a password, and it counts as a second step, so
 * signing in with one doesn't ask for an authenticator code. The page only shows this panel
 * when the API has passkeys configured.
 */
export function PasskeysPanel() {
  const { data, isPending, error: loadError } = authClient.useListPasskeys()
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const passkeys = data ?? []

  async function add(event: FormEvent) {
    event.preventDefault()
    const label = name.trim()
    if (!label) {
      setError("Name the passkey, like \"Work laptop\", so you can tell it apart later.")
      document.getElementById("passkey-name")?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: failure } = await authClient.passkey.addPasskey({ name: label })
      if (failure) {
        setError(addFailureMessage({ code: "code" in failure ? failure.code : undefined, status: failure.status }))
        return
      }
      setName("")
      toast.success("Passkey added. You can now sign in with it.")
    } catch {
      setError("The request didn't finish. Nothing changed. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function remove(id: string): Promise<boolean> {
    const { error: failure } = await authClient.passkey.deletePasskey({ id })
    if (failure) {
      toast.error("We couldn't remove the passkey. Nothing changed. Try again.")
      return false
    }
    toast.success("Passkey removed.")
    return true
  }

  return (
    <Panel
      title="Passkeys"
      description="A passkey signs you in without a password and counts as a second step. It's optional."
    >
      <div className="flex flex-col gap-5">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Loading your passkeys...</p>
        ) : loadError ? (
          <p role="alert" className="text-sm text-destructive">
            We couldn&apos;t load your passkeys. Refresh the page to try again.
          </p>
        ) : passkeys.length === 0 ? (
          <p className="max-w-prose text-sm text-muted-foreground">
            You have no passkeys. Add one on each device you sign in from.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {passkeys.map((passkey) => (
              <li key={passkey.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{passkey.name || "Passkey"}</p>
                  <p className="text-xs text-muted-foreground">
                    {passkey.createdAt ? `Added ${formatDate(passkey.createdAt)}` : "Added earlier"}
                  </p>
                </div>
                <ConfirmAction
                  label="Remove"
                  variant="ghost"
                  size="sm"
                  title="Remove this passkey?"
                  description="You won't be able to sign in with it any more. Your password still works."
                  confirmLabel="Remove passkey"
                  onConfirm={() => remove(passkey.id)}
                />
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={add} noValidate className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passkey-name">Name for a new passkey</Label>
            <Input
              id="passkey-name"
              maxLength={60}
              autoComplete="off"
              placeholder="Work laptop"
              className="max-w-72"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "passkey-error" : undefined}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          {error ? (
            <p id="passkey-error" role="alert" className="text-sm text-pretty text-destructive">
              {error}
            </p>
          ) : null}
          <div>
            <Button type="submit" variant="outline" disabled={busy}>
              {busy ? "Waiting for your device..." : "Add a passkey"}
            </Button>
          </div>
        </form>
      </div>
    </Panel>
  )
}
