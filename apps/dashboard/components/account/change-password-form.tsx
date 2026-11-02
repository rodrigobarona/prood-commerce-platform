"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { FieldError } from "@prood/ui/components/field"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { PasswordInput } from "@prood/ui/components/password-input"
import { newPasswordError, PASSWORD_HINT } from "@prood/ui/lib/auth-fields"
import { authClient } from "@/lib/auth/client"

type Field = "current-password" | "new-password" | "confirm-password"

export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    const found: Partial<Record<Field, string>> = {}
    if (!currentPassword) found["current-password"] = "Enter your current password."
    const invalid = newPasswordError(newPassword)
    if (invalid) found["new-password"] = invalid
    if (newPassword !== confirmPassword) {
      found["confirm-password"] = "Your new passwords don't match. Type the same one twice."
    }
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }

    startTransition(async () => {
      try {
        const { error } = await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        })
        if (error) {
          toast.error(error.message ?? "We couldn't change your password. Check the current one and try again.")
          return
        }
        toast.success("Password changed.")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } catch {
        toast.error("We couldn't change your password. Nothing changed. Try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Panel
        title="Password"
        description="The one you use to sign in to the dashboard."
        footer={
          <Button type="submit" disabled={pending || !(currentPassword || newPassword || confirmPassword)}>
            {pending ? "Changing..." : "Change password"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <PasswordInput
              id="current-password"
              required
              autoComplete="current-password"
              aria-invalid={errors["current-password"] ? true : undefined}
              aria-describedby={errors["current-password"] ? "current-password-error" : undefined}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
            <FieldError id="current-password-error" className="text-xs">
              {errors["current-password"]}
            </FieldError>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              required
              autoComplete="new-password"
              aria-invalid={errors["new-password"] ? true : undefined}
              aria-describedby={errors["new-password"] ? "new-password-error" : "new-password-hint"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <FieldError id="new-password-error" className="text-xs">
              {errors["new-password"]}
            </FieldError>
            <p id="new-password-hint" className="text-xs text-muted-foreground">
              {PASSWORD_HINT}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              required
              autoComplete="new-password"
              aria-invalid={errors["confirm-password"] ? true : undefined}
              aria-describedby={errors["confirm-password"] ? "confirm-password-error" : undefined}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            <FieldError id="confirm-password-error" className="text-xs">
              {errors["confirm-password"]}
            </FieldError>
          </div>
        </div>
      </Panel>
    </form>
  )
}
