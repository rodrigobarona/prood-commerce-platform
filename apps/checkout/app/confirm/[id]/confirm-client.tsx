"use client"

import { useEffect, useState } from "react"
import { Button } from "@prood/ui/components/button"
import { PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE } from "@prood/types"
import { storeUrl } from "@/lib/store-url"

type ConfirmStatus = "loading" | "complete" | "pending" | "failed" | "closed" | "unknown"

interface ConfirmResult {
  state: string
  payable: boolean
  returnUrl: string | null
  orderId: string | null
}

export function statusFor(result: Pick<ConfirmResult, "state" | "payable">): ConfirmStatus {
  if (result.state === "complete") return "complete"
  if (result.state === "pending") return "pending"
  if (!result.payable) return "closed"
  if (result.state === "failed") return "failed"
  if (result.state === "payment" || result.state === "confirming") return "pending"
  // Nothing was started, so there's nothing to confirm yet.
  return "failed"
}

function Panel({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="bg-background flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{children}</p>
      {action}
    </div>
  )
}

export function ConfirmClient({ sessionId, declined }: { sessionId: string; declined: boolean }) {
  const [status, setStatus] = useState<ConfirmStatus>("loading")
  const [returnUrl, setReturnUrl] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const query = declined ? `?${PAYMENT_DECLINED_PARAM}=${PAYMENT_DECLINED_VALUE}` : ""
    fetch(`/api/sessions/${sessionId}/confirm${query}`, {
      method: "POST",
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Confirm request failed (${r.status})`)
        return (await r.json()) as ConfirmResult
      })
      .then((result) => {
        if (!active) return
        setReturnUrl(storeUrl(result))
        setStatus(statusFor(result))
      })
      .catch(() => {
        if (active) setStatus("unknown")
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [sessionId, declined])

  useEffect(() => {
    if (status === "complete" && returnUrl) {
      const timer = setTimeout(() => {
        window.location.href = returnUrl
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [status, returnUrl])

  const backToStore = returnUrl ? (
    <Button asChild variant="outline" className="mt-1">
      <a href={returnUrl}>Back to the store</a>
    </Button>
  ) : null

  switch (status) {
    case "loading":
      return (
        <div className="bg-background flex flex-col items-center gap-3 rounded-2xl border p-6 text-center shadow-sm">
          <p className="text-muted-foreground text-sm">Checking your payment...</p>
        </div>
      )
    case "complete":
      return (
        <Panel title="Payment confirmed">
          {returnUrl ? "Taking you back to the store..." : "Thank you for your purchase."}
        </Panel>
      )
    case "pending":
      return (
        <Panel title="Payment pending" action={backToStore}>
          We&apos;re waiting for your payment. We&apos;ll email you when it arrives.
        </Panel>
      )
    case "failed":
      return (
        <Panel
          title="Payment not completed"
          action={
            <Button asChild className="mt-1">
              <a href={`/c/${sessionId}`}>Try again</a>
            </Button>
          }
        >
          Your payment didn&apos;t go through. You haven&apos;t been charged.
        </Panel>
      )
    case "closed":
      return (
        <Panel title="This order can't be paid" action={backToStore}>
          It&apos;s no longer waiting for payment. Contact the store for help.
        </Panel>
      )
    case "unknown":
      return (
        <Panel title="We couldn't check your payment">
          If you paid, you don&apos;t need to pay again. Reload this page to check, or contact the
          store.
        </Panel>
      )
  }
}
