"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { ConfirmAction } from "@prood/ui/components/confirm-action"
import {
  verifyDomainAction,
  removeDomainAction,
} from "@/app/(dashboard)/domains/actions"

export function DomainActions({
  id,
  domain,
  canVerify,
}: {
  id: string
  domain: string
  canVerify: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleVerify() {
    startTransition(async () => {
      try {
        const result = await verifyDomainAction(id)
        if (result.verified) {
          toast.success("Domain verified.")
        } else {
          toast.info("We can't see your DNS records yet.", {
            description: "Add or update the records below, then verify again.",
          })
        }
        router.refresh()
      } catch {
        toast.error("We couldn't verify this domain. Nothing changed. Try again in a few minutes.")
      }
    })
  }

  async function handleRemove() {
    try {
      await removeDomainAction(id)
      toast.success("Domain removed.")
      router.refresh()
      return true
    } catch {
      toast.error("We couldn't remove this domain. Nothing changed. Try again.")
      return false
    }
  }

  return (
    <div className="-mr-1.5 flex shrink-0 items-center gap-1">
      {canVerify ? (
        <Button variant="outline" disabled={pending} onClick={handleVerify}>
          Verify domain
        </Button>
      ) : null}
      <ConfirmAction
        title={`Remove ${domain}?`}
        description="We stop keeping this domain for your store. Your Prood address keeps working."
        confirmLabel="Remove domain"
        onConfirm={handleRemove}
        trigger={
          <Button variant="ghost" size="icon-sm" disabled={pending} aria-label={`Remove ${domain}`} title="Remove domain">
            <Trash />
          </Button>
        }
      />
    </div>
  )
}
