"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import {
  verifyDomainAction,
  removeDomainAction,
} from "@/app/(dashboard)/domains/actions"

export function DomainActions({
  id,
  verified,
}: {
  id: string
  verified: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleVerify() {
    startTransition(async () => {
      try {
        const result = await verifyDomainAction(id)
        if (result.verified) {
          toast.success("Domain verified")
        } else {
          toast.info("DNS records updated", {
            description: "Add or update the records below, then verify again.",
          })
        }
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Verification failed")
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      try {
        await removeDomainAction(id)
        toast.success("Domain removed")
        router.refresh()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Could not remove domain"
        )
      }
    })
  }

  return (
    <div className="flex items-center justify-end gap-1">
      {!verified ? (
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={handleVerify}
        >
          Verify
        </Button>
      ) : null}
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={handleRemove}
      >
        Remove
      </Button>
    </div>
  )
}
