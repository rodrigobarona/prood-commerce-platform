"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { toast } from "sonner"
import { Badge } from "@prood/ui/components/badge"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { CopyBlock } from "@prood/ui/components/copy-block"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { PasswordInput } from "@prood/ui/components/password-input"
import { authClient } from "@/lib/auth/client"

type Phase =
  | { step: "idle" }
  | { step: "password"; action: "enable" | "codes" }
  | { step: "setup"; secret: string; uri: string; backupCodes: string[] }
  | { step: "codes"; backupCodes: string[]; justEnabled: boolean }

interface Failure {
  code?: string
  status: number
}

/** The API's words are for developers. These are for the person at the dashboard. */
function failureMessage(failure: Failure, fallback: string): string {
  if (failure.code === "INVALID_PASSWORD") return "That password isn't right. Check it and try again."
  if (failure.status === 429) return "There were too many attempts. Wait a minute and try again."
  return fallback
}

/**
 * Two-factor authentication is optional. Turning it on asks for the password,
 * then for one code from the app, so a mistyped key never locks anyone out.
 */
export function TwoFactorPanel({ enabled }: { enabled: boolean }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>({ step: "idle" })
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function reset() {
    setPhase({ step: "idle" })
    setPassword("")
    setCode("")
    setError(null)
  }

  async function submitPassword(event: FormEvent, action: "enable" | "codes") {
    event.preventDefault()
    if (!password) {
      setError("Enter your password.")
      document.getElementById("two-factor-password")?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (action === "enable") {
        const { data, error: failure } = await authClient.twoFactor.enable({ password, method: "totp" })
        if (failure || data?.method !== "totp") {
          setError(failureMessage(failure ?? { status: 500 }, "We couldn't start setup. Nothing changed. Try again."))
          return
        }
        const secret = new URL(data.totpURI).searchParams.get("secret") ?? ""
        setPhase({ step: "setup", secret, uri: data.totpURI, backupCodes: data.backupCodes })
      } else {
        const { data, error: failure } = await authClient.twoFactor.generateBackupCodes({ password })
        if (failure || !data) {
          setError(failureMessage(failure ?? { status: 500 }, "We couldn't make new backup codes. Your old ones still work. Try again."))
          return
        }
        setPhase({ step: "codes", backupCodes: data.backupCodes, justEnabled: false })
      }
      setPassword("")
    } catch {
      setError("The request didn't finish. Nothing changed. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function confirmCode(event: FormEvent, backupCodes: string[]) {
    event.preventDefault()
    const value = code.replace(/\s/g, "")
    if (value.length !== 6) {
      setError("Enter the 6-digit code from your app.")
      document.getElementById("two-factor-code")?.focus()
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { error: failure } = await authClient.twoFactor.verifyTotp({ code: value })
      if (failure) {
        setError(
          failure.code === "INVALID_CODE"
            ? "That code isn't right. Check that your phone's clock is correct and try the newest code."
            : failureMessage(failure, "We couldn't check that code. Nothing changed. Try again.")
        )
        setCode("")
        return
      }
      setCode("")
      setPhase({ step: "codes", backupCodes, justEnabled: true })
      toast.success("Two-factor authentication is on.")
      router.refresh()
    } catch {
      setError("The request didn't finish. Nothing changed. Try again.")
    } finally {
      setBusy(false)
    }
  }

  async function disable(): Promise<boolean> {
    setError(null)
    const { error: failure } = await authClient.twoFactor.disable({ password })
    if (failure) {
      setError(failureMessage(failure, "We couldn't turn it off. Nothing changed. Try again."))
      return false
    }
    toast.success("Two-factor authentication is off.")
    reset()
    router.refresh()
    return true
  }

  const status = <Badge variant={enabled ? "default" : "outline"}>{enabled ? "On" : "Off"}</Badge>

  const passwordField = (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="two-factor-password">Password</Label>
      <PasswordInput
        id="two-factor-password"
        required
        autoComplete="current-password"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "two-factor-error" : undefined}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
    </div>
  )

  const errorText = error ? (
    <p id="two-factor-error" role="alert" className="text-sm text-pretty text-destructive">
      {error}
    </p>
  ) : null

  if (phase.step === "password") {
    const { action } = phase
    return (
      <form onSubmit={(event) => submitPassword(event, action)} noValidate>
        <Panel
          title="Two-factor authentication"
          description={
            action === "enable"
              ? "Enter your password to start. You'll scan a QR code next."
              : "Enter your password to make new backup codes. The old ones stop working."
          }
          actions={status}
          footer={
            <>
              <Button type="submit" disabled={busy}>
                {busy ? "Checking..." : action === "enable" ? "Continue" : "Make new codes"}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={reset}>
                Cancel
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            {passwordField}
            {errorText}
          </div>
        </Panel>
      </form>
    )
  }

  if (phase.step === "setup") {
    const { backupCodes, secret, uri } = phase
    return (
      <form onSubmit={(event) => confirmCode(event, backupCodes)} noValidate>
        <Panel
          title="Two-factor authentication"
          description="Set up your authenticator app. It's not on until you enter a code."
          actions={status}
          footer={
            <>
              <Button type="submit" disabled={busy}>
                {busy ? "Checking..." : "Turn on"}
              </Button>
              <Button type="button" variant="ghost" disabled={busy} onClick={reset}>
                Cancel
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3">
              <p className="text-sm">
                <span className="font-medium">1. Scan this QR code</span> with an authenticator app such as 1Password,
                Google Authenticator or Authy.
              </p>
              <div className="w-fit rounded-lg border border-border bg-white p-3">
                <QRCodeSVG value={uri} size={168} title="QR code for your authenticator app" />
              </div>
              <p className="text-sm text-muted-foreground">Can&apos;t scan it? Enter this key in the app instead.</p>
              <CopyBlock value={secret} label="setup key" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="two-factor-code">
                <span className="font-medium">2. Enter the 6-digit code</span> the app shows
              </Label>
              <Input
                id="two-factor-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={7}
                spellCheck={false}
                className="max-w-40 font-mono tracking-widest"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "two-factor-error" : undefined}
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
            </div>
            {errorText}
          </div>
        </Panel>
      </form>
    )
  }

  if (phase.step === "codes") {
    return (
      <Panel
        title="Your backup codes"
        description={
          phase.justEnabled
            ? "Two-factor authentication is on. Save these codes now. We won't show them again."
            : "Save these codes now. We won't show them again, and your old codes no longer work."
        }
        actions={status}
        footer={
          <Button type="button" onClick={reset}>
            I&apos;ve saved my codes
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          <CopyBlock value={phase.backupCodes.join("\n")} label="backup codes" />
          <p className="text-sm text-muted-foreground">
            Each code works once. Use one to sign in if you lose your phone. Keep them somewhere safe, like a password
            manager.
          </p>
        </div>
      </Panel>
    )
  }

  if (!enabled) {
    return (
      <Panel
        title="Two-factor authentication"
        description="Ask for a code from an authenticator app each time you sign in. It's optional."
        actions={status}
        footer={
          <Button type="button" onClick={() => setPhase({ step: "password", action: "enable" })}>
            Turn on
          </Button>
        }
      >
        <p className="max-w-prose text-sm text-muted-foreground">
          With it on, a stolen password isn&apos;t enough to open your stores. You&apos;ll get backup codes in case you lose
          your phone.
        </p>
      </Panel>
    )
  }

  return (
    <>
      <Panel
        title="Two-factor authentication"
        description="You enter a code from your authenticator app each time you sign in."
        actions={status}
        footer={
          <Button type="button" variant="outline" onClick={() => setPhase({ step: "password", action: "codes" })}>
            Make new backup codes
          </Button>
        }
      >
        <p className="max-w-prose text-sm text-muted-foreground">
          Keep your backup codes safe. If you lose your phone, they&apos;re the only way to sign in.
        </p>
      </Panel>
      <DangerZone
        title="Turn off two-factor authentication"
        description="Your account goes back to a password only. Your backup codes stop working."
        action={
          <ConfirmAction
            label="Turn off"
            variant="destructive"
            title="Turn off two-factor authentication?"
            description="Enter your password to confirm."
            confirmLabel="Turn off"
            onConfirm={disable}
          >
            <div className="flex flex-col gap-2">
              {passwordField}
              {errorText}
            </div>
          </ConfirmAction>
        }
      />
    </>
  )
}
