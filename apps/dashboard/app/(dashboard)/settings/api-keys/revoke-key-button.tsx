"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import { revokeApiKeyAction } from "./actions"

export function RevokeKeyButton({ id, name }: { id: string; name: string }) {
  const router = useRouter()

  async function handleRevoke() {
    try {
      await revokeApiKeyAction(id)
      toast.success(`${name} revoked.`)
      router.refresh()
      return true
    } catch {
      toast.error("We couldn't revoke this key. It still works. Try again.")
      return false
    }
  }

  return (
    <ConfirmAction
      title={`Revoke ${name}?`}
      description="Anything using this key stops working right away. You can't turn it back on."
      confirmLabel="Revoke key"
      onConfirm={handleRevoke}
      trigger={
        <Button variant="ghost" size="icon-sm" className="-mr-1.5" aria-label={`Revoke ${name}`} title="Revoke key">
          <Trash />
        </Button>
      }
    />
  )
}
