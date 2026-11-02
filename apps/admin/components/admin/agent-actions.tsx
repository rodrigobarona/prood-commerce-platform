"use client"

import { unstable_rethrow, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Prohibit } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { revokeAgentAction } from "@/app/(admin)/agents/actions"

export function RevokeAgentButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  async function handleConfirm() {
    try {
      await revokeAgentAction(id)
      toast.success(`${name} revoked.`)
      router.refresh()
      return true
    } catch (err) {
      unstable_rethrow(err)
      toast.error("We couldn't revoke this AI agent. Nothing changed. Try again.")
      return false
    }
  }

  return (
    <ConfirmAction
      title={`Revoke ${name}?`}
      description="This AI agent stops working right away. There's no way to turn it back on from here."
      confirmLabel="Revoke agent"
      onConfirm={handleConfirm}
      trigger={
        <Button variant="ghost" size="icon-sm" className="-mr-1.5" aria-label={`Revoke ${name}`} title="Revoke agent">
          <Prohibit />
        </Button>
      }
    />
  )
}
