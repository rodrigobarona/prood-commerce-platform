"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { safeRedirectPath } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { Checkbox } from "@prood/ui/components/checkbox"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { PageHeader } from "@prood/ui/components/page-header"

type Method = "totp" | "backup"

interface VerifyResult {
  error: { status: number; code?: string } | null
}

interface VerifyInput {
  code: string
  trustDevice?: boolean
}

/** The part of an app's Better Auth client that the second step of a sign-in needs. */
export interface TwoFactorClient {
  verifyTotp(input: VerifyInput): Promise<VerifyResult>
  verifyBackupCode(input: VerifyInput): Promise<VerifyResult>
}

const COPY: Record<Method, { title: string; description: string; label: string }> = {
  totp: {
    title: "Enter your code",
    description: "Open your authenticator app and enter the 6-digit code it shows for Prood.",
    label: "6-digit code",
  },
  backup: {
    title: "Use a backup code",
    description: "Enter one of the backup codes you saved when you turned on two-factor authentication. Each one works once.",
    label: "Backup code",
  },
}

/** The API's words are for developers. These are for the person signing in. */
function verifyErrorMessage(method: Method, error: { status: number; code?: string }): string {
  switch (error.code) {
    case "INVALID_TWO_FACTOR_COOKIE":
    case "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE":
      return "This sign-in has expired. Go back to sign in and start again."
    case "ACCOUNT_TEMPORARILY_LOCKED":
      return "There were too many wrong codes, so this account is locked for a while. Try again in 15 minutes."
    case "INVALID_BACKUP_CODE":
      return "That backup code isn't right, or you already used it. Check it and try again."
    case "INVALID_CODE":
      return "That code isn't right. Check that your phone's clock is correct and try the newest code."
  }
  if (error.status === 429) return "There were too many attempts. Wait a minute and try again."
  return method === "backup"
    ? "We couldn't check that backup code. Something went wrong on our side. Try again in a moment."
    : "We couldn't check that code. Something went wrong on our side. Try again in a moment."
}

/**
 * The second step of a sign-in for an account with two-factor authentication
 * on. The password step has already run, so the browser holds a short-lived
 * challenge and no session yet.
 */
export function TwoFactorForm({
  client,
  redirect,
  offerTrustDevice,
}: {
  client: TwoFactorClient
  /** Where to go once the code is accepted. Checked again here, so any string is safe. */
  redirect: string | null
  /** Lets a person skip the code on this browser for 30 days. Not for staff tools. */
  offerTrustDevice: boolean
}) {
  const router = useRouter()
  const [method, setMethod] = useState<Method>("totp")
  const [code, setCode] = useState("")
  const [trustDevice, setTrustDevice] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const copy = COPY[method]

  function switchMethod() {
    setMethod(method === "totp" ? "backup" : "totp")
    setCode("")
    setError(null)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = method === "totp" ? code.replace(/\s/g, "") : code.trim()
    if (!value) {
      setError(method === "totp" ? "Enter the 6-digit code." : "Enter a backup code.")
      document.getElementById("code")?.focus()
      return
    }

    setLoading(true)
    setError(null)
    try {
      const input = { code: value, ...(offerTrustDevice ? { trustDevice } : {}) }
      const { error: verifyError } =
        method === "totp" ? await client.verifyTotp(input) : await client.verifyBackupCode(input)
      if (verifyError) {
        setError(verifyErrorMessage(method, verifyError))
        setCode("")
        return
      }
      router.push(safeRedirectPath(redirect))
      router.refresh()
    } catch {
      setError("We couldn't check that code. The request didn't finish. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={copy.title} description={copy.description} />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="code">{copy.label}</Label>
          <Input
            id="code"
            key={method}
            autoFocus
            required
            autoComplete="one-time-code"
            inputMode={method === "totp" ? "numeric" : "text"}
            maxLength={method === "totp" ? 7 : 32}
            spellCheck={false}
            className={method === "totp" ? "font-mono tracking-widest" : "font-mono"}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "code-error" : undefined}
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
        {offerTrustDevice ? (
          <div className="flex items-center gap-2">
            <Checkbox
              id="trust-device"
              checked={trustDevice}
              onCheckedChange={(checked) => setTrustDevice(checked === true)}
            />
            <Label htmlFor="trust-device" className="font-normal">
              Trust this device for 30 days
            </Label>
          </div>
        ) : null}
        {error ? (
          <p id="code-error" role="alert" className="text-sm text-pretty text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Checking..." : "Verify"}
        </Button>
        <p className="text-sm text-muted-foreground">
          <button
            type="button"
            className="text-foreground underline underline-offset-4"
            onClick={switchMethod}
          >
            {method === "totp" ? "Use a backup code" : "Use your authenticator app"}
          </button>
          {" · "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

/** The two-factor screen, wired to an app's auth client. */
export function twoFactorPanel(client: TwoFactorClient, options: { offerTrustDevice: boolean }) {
  return function TwoFactorPanel() {
    const searchParams = useSearchParams()
    return (
      <TwoFactorForm
        client={client}
        redirect={searchParams.get("redirect")}
        offerTrustDevice={options.offerTrustDevice}
      />
    )
  }
}
