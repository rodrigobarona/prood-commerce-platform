"use client"

import { unstable_rethrow, useRouter } from "next/navigation"
import { toast } from "sonner"
import { SignOut } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { revokeSession } from "@/app/(admin)/users/actions"

export function RevokeSessionButton({
  sessionId,
  userId,
  userName,
}: {
  sessionId: string
  userId: string
  userName: string
}) {
  const router = useRouter()

  async function handleRevoke() {
    try {
      await revokeSession(sessionId, userId)
      toast.success(`${userName} signed out of this device.`)
      router.refresh()
      return true
    } catch (err) {
      unstable_rethrow(err)
      toast.error("We couldn't revoke this session. Nothing changed. Try again.")
      return false
    }
  }

  return (
    <ConfirmAction
      title={`Sign ${userName} out of this device?`}
      description="This session ends right away. Their other devices stay signed in."
      confirmLabel="Revoke session"
      onConfirm={handleRevoke}
      trigger={
        <Button
          variant="ghost"
          size="icon-sm"
          className="-mr-1.5"
          aria-label={`Revoke ${userName}'s session`}
          title="Revoke session"
        >
          <SignOut />
        </Button>
      }
    />
  )
}
