"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
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
 * Signing in again starts on the merchant's first store. The merchant switches
 * back to the store the request was opened in here, by choice, so the agent
 * isn't approved for another store by accident.
 */
export function SwitchToStore({ storeId, storeName }: { storeId: string; storeName: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)

  async function switchStore() {
    setPending(true)
    setFailed(false)
    try {
      const { error } = await authClient.organization.setActive({ organizationId: storeId })
      if (error) throw error
      router.refresh()
    } catch {
      setPending(false)
      setFailed(true)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t switch to {storeName}. Try again, or{" "}
          <Link href="/" className="underline underline-offset-4">
            go to your dashboard
          </Link>
          .
        </p>
      ) : null}
      <div>
        <Button type="button" size="lg" onClick={switchStore} disabled={pending}>
          {pending ? "Switching..." : `Switch to ${storeName}`}
        </Button>
      </div>
    </div>
  )
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
