"use client"

import { useState, useTransition } from "react"
import { unstable_rethrow, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { DangerZone } from "@prood/ui/components/danger-zone"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import {
  banUser,
  revokeAllUserSessions,
  setUserRole,
  unbanUser,
} from "../actions"

type Role = "user" | "admin"

interface UserActionsProps {
  user: {
    id: string
    name: string
    role: string
    banned: boolean | null
  }
}

const FAILED = "Nothing changed. Try again."

/** Runs an action, reports the outcome and says whether it worked. */
function useRunAction() {
  const router = useRouter()

  return async function run(action: () => Promise<void>, done: string, failed: string) {
    try {
      await action()
      toast.success(done)
      router.refresh()
      return true
    } catch (err) {
      unstable_rethrow(err)
      toast.error(`${failed} ${FAILED}`)
      return false
    }
  }
}

export function UserRoleForm({ user }: UserActionsProps) {
  const run = useRunAction()
  const [role, setRole] = useState<Role>(user.role as Role)
  const nextRole = role === "admin" ? "an admin" : "a user"

  return (
    <Panel
      title="Manage access"
      footer={
        <ConfirmAction
          label="Change role"
          variant="default"
          title={`Make ${user.name} ${nextRole}?`}
          description={
            role === "admin"
              ? "They get full access to this console: every store, user and session."
              : "They lose access to this console right away."
          }
          confirmLabel="Change role"
          disabled={role === user.role}
          onConfirm={() =>
            run(
              () => setUserRole(user.id, role),
              `${user.name} is now ${nextRole}.`,
              "We couldn't change this role."
            )
          }
        />
      }
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="user-role">Role</Label>
        <Select value={role} onValueChange={(value) => setRole(value as Role)}>
          <SelectTrigger id="user-role" className="w-full data-[size=default]:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Panel>
  )
}

export function UserDangerZone({ user }: UserActionsProps) {
  const run = useRunAction()
  const [isPending, startTransition] = useTransition()
  const [banReason, setBanReason] = useState("")

  function handleUnban() {
    startTransition(async () => {
      await run(() => unbanUser(user.id), `${user.name} unbanned.`, "We couldn't unban this user.")
    })
  }

  return (
    <DangerZone
      title={user.banned ? `${user.name} is banned` : `End ${user.name}'s access`}
      description={
        user.banned
          ? "They can't sign in until an administrator unbans them."
          : "Revoking signs them out everywhere. A ban also stops them signing in until an administrator unbans them."
      }
      action={
        <div className="flex flex-wrap gap-2">
          <ConfirmAction
            label="Revoke all sessions"
            title={`Revoke all sessions for ${user.name}?`}
            description="They're signed out everywhere and have to sign in again."
            confirmLabel="Revoke all sessions"
            disabled={isPending}
            onConfirm={() =>
              run(
                () => revokeAllUserSessions(user.id),
                "All sessions revoked.",
                "We couldn't revoke these sessions."
              )
            }
          />
          {user.banned ? (
            <Button variant="outline" onClick={handleUnban} disabled={isPending}>
              Unban user
            </Button>
          ) : (
            <ConfirmAction
              label="Ban user"
              title={`Ban ${user.name}?`}
              description="They're signed out and can't sign in until an administrator unbans them."
              confirmLabel="Ban user"
              disabled={isPending}
              onConfirm={() =>
                run(
                  () => banUser(user.id, banReason.trim() || undefined),
                  `${user.name} banned.`,
                  "We couldn't ban this user."
                )
              }
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="ban-reason">Reason (optional)</Label>
                <Input
                  id="ban-reason"
                  value={banReason}
                  onChange={(event) => setBanReason(event.target.value)}
                />
              </div>
            </ConfirmAction>
          )}
        </div>
      }
    />
  )
}
