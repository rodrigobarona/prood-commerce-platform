"use client"

import { useActionState } from "react"
import { Button } from "@prood/ui/components/button"
import {
  approveCapabilityRequest,
  denyCapabilityRequest,
  type ApprovalActionState,
} from "./approval"

const initialState: ApprovalActionState = {}

export function ApprovalControls({ requestId }: { requestId: string }) {
  const approveAction = approveCapabilityRequest.bind(null, requestId)
  const denyAction = denyCapabilityRequest.bind(null, requestId)
  const [approveState, submitApprove, approvePending] = useActionState(
    approveAction,
    initialState
  )
  const [denyState, submitDeny, denyPending] = useActionState(denyAction, initialState)
  const pending = approvePending || denyPending

  return (
    <div className="space-y-3 rounded-2xl border p-4">
      {approveState.error ? (
        <p className="text-sm text-destructive">{approveState.error}</p>
      ) : null}
      {denyState.error ? <p className="text-sm text-destructive">{denyState.error}</p> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={submitApprove}>
          <Button type="submit" disabled={pending}>
            {approvePending ? "Approving..." : "Approve capabilities"}
          </Button>
        </form>

        <form action={submitDeny} className="flex flex-1 flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="deny-reason">
            Denial reason
          </label>
          <input
            id="deny-reason"
            name="reason"
            className="min-h-10 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Optional denial reason"
            disabled={pending}
          />
          <Button type="submit" variant="outline" disabled={pending}>
            {denyPending ? "Denying..." : "Deny"}
          </Button>
        </form>
      </div>
    </div>
  )
}
