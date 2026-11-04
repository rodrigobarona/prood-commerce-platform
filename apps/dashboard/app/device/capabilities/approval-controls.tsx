"use client"

import { useActionState, useEffect, useState } from "react"
import { unstable_rethrow, useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import {
  approveCapabilityRequest,
  denyCapabilityRequest,
  type ApprovalActionState,
} from "./approval"
import { authClient } from "@/lib/auth/client"

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

/** Ends this session and comes back here after signing in, which counts as a fresh sign-in. */
function SignInAgainButton({ requestId, storeId, disabled }: { requestId: string; storeId: string; disabled: boolean }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signInAgain() {
    setPending(true)
    try {
      const { error } = await authClient.signOut()
      if (error) throw error
      const back = `/device/capabilities?request_id=${encodeURIComponent(requestId)}&store=${encodeURIComponent(storeId)}`
      router.push(`/login?redirect=${encodeURIComponent(back)}`)
      router.refresh()
    } catch {
      setPending(false)
      toast.error("We couldn't sign you out. The request didn't finish. Try again.")
    }
  }

  return (
    <Button type="button" size="lg" onClick={signInAgain} disabled={disabled || pending}>
      {pending ? "Signing out..." : "Sign in again to approve"}
    </Button>
  )
}

/**
 * Signing in again starts on the merchant's first store. This switches back to
 * the store the request was opened for, so the agent isn't approved for another.
 */
export function ReturnToStore({ storeId, activeStoreId }: { storeId: string; activeStoreId: string }) {
  const router = useRouter()
  useEffect(() => {
    if (storeId === activeStoreId) return
    authClient.organization
      .setActive({ organizationId: storeId })
      .then(({ error }) => {
        if (error) throw error
        router.refresh()
      })
      .catch(() => toast.error("We couldn't switch back to the store this request was for. Switch stores to approve it."))
  }, [storeId, activeStoreId, router])
  return null
}

export function ApprovalControls({
  requestId,
  storeId,
  needsFreshSignIn,
}: {
  requestId: string
  /** The store the agent will be approved for. */
  storeId: string
  needsFreshSignIn: boolean
}) {
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
        {approveState.error && !approveState.needsFreshSignIn ? (
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

        {needsFreshSignIn || approveState.needsFreshSignIn ? (
          <div className="flex flex-col gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              This agent could change your store, so approving it needs a sign-in from the last 10 minutes.
            </p>
            <div>
              <SignInAgainButton requestId={requestId} storeId={storeId} disabled={pending} />
            </div>
          </div>
        ) : (
          <form action={submitApprove} className="border-t border-border pt-4">
            <Button type="submit" size="lg" disabled={pending}>
              {approvePending ? "Approving..." : "Approve access"}
            </Button>
          </form>
        )}
      </div>
    </Panel>
  )
}
