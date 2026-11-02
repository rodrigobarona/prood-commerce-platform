"use client"

import { useEffect, useState } from "react"
import type { StoreHint } from "@prood/checkout-host"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Skeleton } from "@prood/ui/components/skeleton"
import { PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE } from "@prood/types"
import { useCheckoutContext } from "@/components/checkout-context"
import { PaymentReceipt } from "@/components/payment-receipt"
import { StatusPanel, StoreContact, onwardProps } from "@/components/status-panel"
import type { SessionDetails } from "@/lib/session-details"
import { storeUrl } from "@/lib/store-url"

/** Long enough to read the receipt before the store's fuller order page takes over. */
const RETURN_DELAY_MS = 6000

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

export function ConfirmClient({
  sessionId,
  declined,
  hint = null,
}: {
  sessionId: string
  declined: boolean
  /** Who this payment belongs to, from its link, for when the session can't say. */
  hint?: StoreHint | null
}) {
  const [status, setStatus] = useState<ConfirmStatus>("loading")
  const [returnUrl, setReturnUrl] = useState<string | null>(null)
  const [details, setDetails] = useState<SessionDetails | null>(null)
  const [attempt, setAttempt] = useState(0)
  const { setSession } = useCheckoutContext()

  // The confirm call says how the payment stands; the session says whose it was.
  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetch(`/api/sessions/${sessionId}`, { signal: controller.signal })
      .then((r) => (r.ok ? (r.json() as Promise<SessionDetails>) : null))
      .catch(() => null)
      .then((session) => {
        if (!active) return
        setDetails(session)
        setSession({
          storeName: session?.storeName ?? hint?.name ?? null,
          returnUrl: session?.returnUrl ?? hint?.home ?? null,
        })
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [sessionId, attempt, hint, setSession])

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
  }, [sessionId, declined, attempt])

  useEffect(() => {
    if (status === "complete" && returnUrl) {
      const timer = setTimeout(() => {
        window.location.href = returnUrl
      }, RETURN_DELAY_MS)
      return () => clearTimeout(timer)
    }
  }, [status, returnUrl])

  // Check again took the button that held focus with it.
  useEffect(() => {
    if (attempt > 0 && status !== "loading") {
      document.querySelector<HTMLElement>("[data-step-heading]")?.focus()
    }
  }, [attempt, status])

  const orderHref = returnUrl ?? (details ? storeUrl(details) : null)
  const storeLink = orderHref ?? hint?.home ?? null
  const backToStore = storeLink ? (
    <CommerceButton asChild variant="outline">
      <a href={storeLink}>Back to the store</a>
    </CommerceButton>
  ) : null
  // A link's store is only the front door, so it can't promise the order.
  const orderLink = orderHref ? (
    <CommerceButton asChild variant="outline">
      <a href={orderHref}>View your order</a>
    </CommerceButton>
  ) : (
    backToStore
  )
  const storeEmail = details?.storeEmail ?? hint?.email
  const storeName = details?.storeName ?? hint?.name
  const contact = <StoreContact email={storeEmail} storeName={storeName} />
  const orderNumber = details?.order?.number

  switch (status) {
    case "loading":
      return (
        <div className="flex flex-col gap-3" role="status">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-9 w-3/4 rounded-lg" />
          <p className="text-muted-foreground">Checking your payment...</p>
        </div>
      )
    case "complete":
      return (
        <StatusPanel
          tone="success"
          title="Payment confirmed"
          details={details ? <PaymentReceipt details={details} /> : null}
          {...onwardProps(orderLink, { email: storeEmail, name: storeName, orderNumber })}
        >
          {returnUrl ? "Thank you for your purchase. Taking you back to the store..." : "Thank you for your purchase."}
        </StatusPanel>
      )
    case "pending":
      return (
        <StatusPanel
          tone="pending"
          title="Payment pending"
          details={details ? <PaymentReceipt details={details} pending /> : null}
          action={orderLink}
          contact={contact}
        >
          We&apos;re waiting for your payment. We&apos;ll email you when it arrives.
        </StatusPanel>
      )
    case "failed":
      return (
        <StatusPanel
          tone="failed"
          title="Payment not completed"
          details={details ? <PaymentReceipt details={details} pending /> : null}
          action={
            <>
              <CommerceButton asChild>
                <a href={`/c/${sessionId}`}>Try again</a>
              </CommerceButton>
              {backToStore}
            </>
          }
          contact={contact}
        >
          Your payment didn&apos;t go through. You haven&apos;t been charged.
        </StatusPanel>
      )
    case "closed":
      return (
        <StatusPanel tone="neutral" title="This order can't be paid" action={backToStore} contact={contact}>
          It&apos;s no longer waiting for payment.
        </StatusPanel>
      )
    case "unknown":
      return (
        <StatusPanel
          tone="neutral"
          title="Your payment can't be checked right now"
          action={
            <>
              <CommerceButton
                onClick={() => {
                  setStatus("loading")
                  setAttempt((current) => current + 1)
                }}
              >
                Check again
              </CommerceButton>
              {backToStore}
            </>
          }
          contact={contact}
        >
          This payment page can&apos;t read its records right now. If you paid, you don&apos;t need to pay again.
          {orderNumber ? ` Your order is #${orderNumber}.` : ""}
        </StatusPanel>
      )
  }
}
