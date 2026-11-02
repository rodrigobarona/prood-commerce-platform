"use client"

import { useActionState } from "react"
import { unstable_rethrow } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import {
  approveCapabilityRequest,
  denyCapabilityRequest,
  type ApprovalActionState,
} from "./approval"

const initialState: ApprovalActionState = {}

/** Keeps a request that never finished on this page, with its reason. A redirect still goes through. */
function staysOnFailure(action: (state: ApprovalActionState, formData: FormData) => Promise<ApprovalActionState>, failed: string) {
  return async (state: ApprovalActionState, formData: FormData): Promise<ApprovalActionState> => {
    try {
      return await action(state, formData)
    } catch (err) {
      unstable_rethrow(err)
      return { error: failed }
    }
  }
}

export function ApprovalControls({ requestId }: { requestId: string }) {
  const approveAction = staysOnFailure(
    approveCapabilityRequest.bind(null, requestId),
    "We couldn't approve this request. Nothing changed. Try again."
  )
  const denyAction = staysOnFailure(
    denyCapabilityRequest.bind(null, requestId),
    "We couldn't deny this request. Nothing changed. Try again."
  )
  const [approveState, submitApprove, approvePending] = useActionState(
    approveAction,
    initialState
  )
  const [denyState, submitDeny, denyPending] = useActionState(denyAction, initialState)
  const pending = approvePending || denyPending

  return (
    <Panel>
      <div className="flex flex-col gap-4">
        {approveState.error ? (
          <p role="alert" className="text-sm text-destructive">
            {approveState.error}
          </p>
        ) : null}
        {denyState.error ? (
          <p role="alert" className="text-sm text-destructive">
            {denyState.error}
          </p>
        ) : null}

        <form action={submitDeny} className="flex flex-col gap-1.5">
          <Label htmlFor="deny-reason">Reason for denying (optional)</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id="deny-reason" name="reason" className="flex-1" disabled={pending} />
            <Button type="submit" size="lg" variant="outline" disabled={pending}>
              {denyPending ? "Denying..." : "Deny request"}
            </Button>
          </div>
        </form>

        <form action={submitApprove} className="border-t border-border pt-4">
          <Button type="submit" size="lg" disabled={pending}>
            {approvePending ? "Approving..." : "Approve access"}
          </Button>
        </form>
      </div>
    </Panel>
  )
}
