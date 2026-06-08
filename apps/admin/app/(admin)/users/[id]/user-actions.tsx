"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import {
  banUser,
  unbanUser,
  setUserRole,
  revokeAllUserSessions,
} from "../actions"

interface UserActionsProps {
  user: {
    id: string
    role: string
    banned: boolean | null
  }
}

export function UserActions({ user }: UserActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [roleInput, setRoleInput] = useState<"user" | "admin">(
    user.role as "user" | "admin"
  )

  function handleBan() {
    startTransition(async () => {
      try {
        await banUser(user.id)
        toast.success("User banned")
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to ban user"
        )
      }
    })
  }

  function handleUnban() {
    startTransition(async () => {
      try {
        await unbanUser(user.id)
        toast.success("User unbanned")
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to unban user"
        )
      }
    })
  }

  function handleSetRole() {
    if (roleInput === user.role) return
    startTransition(async () => {
      try {
        await setUserRole(user.id, roleInput)
        toast.success(`Role updated to "${roleInput}"`)
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to update role"
        )
      }
    })
  }

  function handleRevokeSessions() {
    startTransition(async () => {
      try {
        await revokeAllUserSessions(user.id)
        toast.success("All sessions revoked")
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to revoke sessions"
        )
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-md border p-1">
        <select
          value={roleInput}
          onChange={(e) =>
            setRoleInput(e.target.value as "user" | "admin")
          }
          className="h-8 rounded-md border-0 bg-transparent px-2 text-sm focus:ring-0"
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSetRole}
          disabled={isPending || roleInput === user.role}
        >
          Set role
        </Button>
      </div>

      {user.banned ? (
        <Button
          size="sm"
          variant="outline"
          onClick={handleUnban}
          disabled={isPending}
        >
          Unban
        </Button>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          onClick={handleBan}
          disabled={isPending}
        >
          Ban user
        </Button>
      )}

      <Button
        size="sm"
        variant="outline"
        onClick={handleRevokeSessions}
        disabled={isPending}
      >
        Revoke all sessions
      </Button>
    </div>
  )
}
