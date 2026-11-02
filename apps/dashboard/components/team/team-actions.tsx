"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash, X } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { authClient } from "@/lib/auth/client"

export function RemoveMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter()

  async function handleRemove() {
    try {
      const { error } = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      })
      if (error) {
        toast.error(error.message ?? "We couldn't remove this member. Nothing changed. Try again.")
        return false
      }
      toast.success(`${name} removed.`)
      router.refresh()
      return true
    } catch {
      toast.error("We couldn't remove this member. Nothing changed. Try again.")
      return false
    }
  }

  return (
    <ConfirmAction
      title={`Remove ${name}?`}
      description="They lose access to this store right away. You can invite them again later."
      confirmLabel="Remove member"
      onConfirm={handleRemove}
      trigger={
        <Button variant="ghost" size="icon-sm" className="-mr-1.5" aria-label={`Remove ${name}`} title="Remove member">
          <Trash />
        </Button>
      }
    />
  )
}

export function CancelInvitationButton({
  invitationId,
  email,
}: {
  invitationId: string
  email: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleCancel() {
    startTransition(async () => {
      try {
        const { error } = await authClient.organization.cancelInvitation({ invitationId })
        if (error) {
          toast.error(error.message ?? "We couldn't cancel this invitation. Nothing changed. Try again.")
          return
        }
        toast.success("Invitation canceled.")
        router.refresh()
      } catch {
        toast.error("We couldn't cancel this invitation. Nothing changed. Try again.")
      }
    })
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className="-mr-1.5"
      disabled={pending}
      onClick={handleCancel}
      aria-label={`Cancel the invitation for ${email}`}
      title="Cancel invitation"
    >
      <X />
    </Button>
  )
}
