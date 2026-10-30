"use client"

import { useState, useTransition } from "react"
import { Button } from "@prood/ui/components/button"
import { acceptInvitationAction, declineInvitationAction } from "./actions"

export function InvitationResponse({ invitationId }: { invitationId: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function respond(action: typeof acceptInvitationAction) {
    setError(null)
    startTransition(async () => {
      const result = await action(invitationId)
      setError(result.error)
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
        <Button className="flex-1" disabled={pending} onClick={() => respond(acceptInvitationAction)}>
          Join store
        </Button>
        <Button variant="outline" disabled={pending} onClick={() => respond(declineInvitationAction)}>
          Decline
        </Button>
      </div>
    </div>
  )
}
