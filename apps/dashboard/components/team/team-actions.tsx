"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { authClient } from "@/lib/auth/client"

export function RemoveMemberButton({
  memberId,
  disabled,
}: {
  memberId: string
  disabled?: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleRemove() {
    startTransition(async () => {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })
      if (error) {
        toast.error(error.message ?? "Could not remove member")
        return
      }
      toast.success("Member removed")
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending || disabled}
      onClick={handleRemove}
    >
      Remove
    </Button>
  )
}

export function CancelInvitationButton({
  invitationId,
}: {
  invitationId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      const { error } = await authClient.organization.cancelInvitation({ invitationId })
      if (error) {
        toast.error(error.message ?? "Could not cancel invitation")
        return
      }
      toast.success("Invitation cancelled")
      router.refresh()
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={handleCancel}
    >
      Cancel
    </Button>
  )
}
