"use client"

import { useState, useTransition } from "react"
import { unstable_rethrow } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { acceptInvitationAction, declineInvitationAction } from "./actions"

export function InvitationResponse({ invitationId }: { invitationId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function respond(action: typeof acceptInvitationAction) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await action(invitationId)
        setError(result.error)
      } catch (err) {
        // Both actions end in a redirect, which reaches the client as a rejection.
        unstable_rethrow(err)
        setError("We couldn't answer this invitation. Nothing changed. Try again.")
      }
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button size="lg" className="flex-1" disabled={pending} onClick={() => respond(acceptInvitationAction)}>
          Join store
        </Button>
        <Button size="lg" variant="outline" disabled={pending} onClick={() => respond(declineInvitationAction)}>
          Decline invitation
        </Button>
      </div>
    </div>
  )
}
