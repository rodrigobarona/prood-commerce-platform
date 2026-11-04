"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { revokeAgentAction } from "./actions"

export function RevokeAgentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  async function handleRevoke() {
    try {
      await revokeAgentAction(id)
      toast.success(`${name} can't reach your store anymore.`)
      router.refresh()
      return true
    } catch {
      toast.error("We couldn't revoke this agent. It still has access. Try again.")
      return false
    }
  }

  return (
    <ConfirmAction
      title={`Revoke ${name}?`}
      description="The agent loses all access to your store right away. To use it again, it has to ask and you approve it again."
      confirmLabel="Revoke agent"
      onConfirm={handleRevoke}
      trigger={
        <Button variant="ghost" size="icon-sm" className="-mr-1.5" aria-label={`Revoke ${name}`} title="Revoke agent">
          <Trash />
        </Button>
      }
    />
  )
}
