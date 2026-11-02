"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import { Button } from "@prood/ui/components/button"
import { FieldError } from "@prood/ui/components/field"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { PageHeader } from "@prood/ui/components/page-header"
import { PasswordInput } from "@prood/ui/components/password-input"
import { emailError, newPasswordError, PASSWORD_HINT } from "@prood/ui/lib/auth-fields"

const LINK = "text-foreground underline underline-offset-4"

const REQUEST_FAILED = "We couldn't send the link. Something went wrong on our side. Try again in a moment."
const RESET_FAILED = "We couldn't change your password. This link may have expired or been used already."
const TOO_MANY = "There were too many attempts. Wait a minute and try again."
const MISSING_TOKEN = "It's missing its code, or it was cut off. Request a new one and we'll send it again."
const EXPIRED_TOKEN = "It has expired or was already used. Links work for one hour. Request a new one and we'll send it again."

/** Resolves to an error message, or null when it worked. */
type AuthCall<Input> = (input: Input) => Promise<string | null>

/** The part of an app's Better Auth client that a password reset needs. */
interface PasswordResetClient {
  requestPasswordReset(input: { email: string; redirectTo: string }): Promise<{ error: { status: number } | null }>
  resetPassword(input: { newPassword: string; token: string }): Promise<{ error: { status: number } | null }>
}

/**
 * The first half of a password reset. It says the same thing whether or not the
 * account exists, so nobody can use it to find out who has one.
 */
export function ForgotPasswordForm({ requestReset }: { requestReset: AuthCall<string> }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [fieldError, setFieldError] = useState<string>()

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const invalid = emailError(email)
    setFieldError(invalid)
    if (invalid) {
      document.getElementById("email")?.focus()
      return
    }

    setLoading(true)
    setError(null)
    const message = await requestReset(email)
    setLoading(false)
    if (message) setError(message)
    else setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Check your email"
          description={`If ${email} has an account, a reset link is on its way. It works for one hour.`}
        />
        <p className="text-sm text-muted-foreground">
          Nothing after a few minutes? Check your spam folder or{" "}
          <button type="button" className={LINK} onClick={() => setSent(false)}>
            try another address
          </button>
          .
        </p>
        <Button asChild size="lg" variant="outline">
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reset your password" description="We'll email you a link to choose a new one." />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "email-error" : undefined}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <FieldError id="email-error" className="text-xs">
            {fieldError}
          </FieldError>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-pretty text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
        <p className="text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className={LINK}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  )
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="This reset link doesn't work" description={message} />
      <Button asChild size="lg">
        <Link href="/forgot-password">Request a new link</Link>
      </Button>
    </div>
  )
}

/** The second half: the link from the email lands here with its token. */
export function ResetPasswordForm({
  token,
  linkError,
  resetPassword,
}: {
  token: string | null
  /** The API sends a dead link back here with `?error=` instead of a token. */
  linkError: string | null
  resetPassword: AuthCall<{ password: string; token: string }>
}) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [fieldError, setFieldError] = useState<string>()

  if (!token) {
    return <InvalidLink message={linkError ? EXPIRED_TOKEN : MISSING_TOKEN} />
  }

  async function handleSubmit(event: FormEvent, resetToken: string) {
    event.preventDefault()
    const invalid = newPasswordError(password)
    setFieldError(invalid)
    if (invalid) {
      document.getElementById("password")?.focus()
      return
    }

    setLoading(true)
    setError(null)
    const message = await resetPassword({ password, token: resetToken })
    setLoading(false)
    if (message) setError(message)
    else setDone(true)
  }

  if (done) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Password changed" description="Sign in with your new password." />
        <Button asChild size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Choose a new password" description="Pick one you don't use anywhere else." />
      <form onSubmit={(event) => handleSubmit(event, token)} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            required
            autoComplete="new-password"
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={fieldError ? "password-error" : "password-hint"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FieldError id="password-error" className="text-xs">
            {fieldError}
          </FieldError>
          <p id="password-hint" className="text-xs text-muted-foreground">
            {PASSWORD_HINT}
          </p>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-pretty text-destructive">
            {error}{" "}
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new link
            </Link>
          </p>
        ) : null}
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Saving..." : "Save new password"}
        </Button>
      </form>
    </div>
  )
}

/** The forgot and reset screens, wired to an app's auth client. */
export function passwordResetPanels(client: PasswordResetClient) {
  /** The reset link goes through the API, so it needs this app's full address to come back to. */
  async function requestReset(email: string): Promise<string | null> {
    const { error } = await client.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (!error) return null
    return error.status === 429 ? TOO_MANY : REQUEST_FAILED
  }

  async function resetPassword(input: { password: string; token: string }): Promise<string | null> {
    const { error } = await client.resetPassword({ newPassword: input.password, token: input.token })
    if (!error) return null
    return error.status === 429 ? TOO_MANY : RESET_FAILED
  }

  return {
    ForgotPasswordPanel: function ForgotPasswordPanel() {
      return <ForgotPasswordForm requestReset={requestReset} />
    },
    ResetPasswordPanel: function ResetPasswordPanel() {
      const searchParams = useSearchParams()
      return (
        <ResetPasswordForm
          token={searchParams.get("token")}
          linkError={searchParams.get("error")}
          resetPassword={resetPassword}
        />
      )
    },
  }
}
