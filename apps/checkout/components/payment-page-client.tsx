"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@workspace/ui/components/skeleton"

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
    }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}
import { StripePayment } from "./stripe-payment"
import { ReferencePayment } from "./reference-payment"

interface SessionData {
  sessionId: string
  providerId: string
  publishableKey?: string
  kind: "cs" | "pl"
  state: string
  amount: number
  currency: string
  orderId: string | null
  expiresAt: string | null
  error: string | null
  paymentSession?: {
    id: string
    status: string
    redirectUrl?: string
    providerData?: Record<string, unknown>
  } | null
}

export function PaymentPageClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payResult, setPayResult] = useState<SessionData | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    fetch(`/api/sessions/${sessionId}`)
      .then((r) => r.json())
      .then((d: SessionData & { error?: string }) => {
        if (d.error) {
          setError(d.error)
        } else {
          setData(d)
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load session")
        setLoading(false)
      })
  }, [sessionId])

  useEffect(() => {
    if (!data?.expiresAt) return
    const target = new Date(data.expiresAt).getTime()
    const tick = () => {
      const remaining = Math.max(0, Math.floor((target - Date.now()) / 1000))
      setTimeLeft(remaining)
      if (remaining <= 0) setError("This payment link has expired")
    }
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [data?.expiresAt])

  async function handlePay() {
    if (!data) return
    setPaying(true)
    setError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "customer@checkout.local" }),
      })
      const result = (await res.json()) as SessionData & { clientSecret?: string; redirectUrl?: string; error?: string }
      if (result.error) {
        setError(result.error)
        setPaying(false)
        return
      }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
        return
      }
      setPayResult(result)
      setPaying(false)
    } catch {
      setError("Payment failed")
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-red-600">Error</h2>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const formatted = formatAmount(data.amount, data.currency)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const confirmUrl = `${baseUrl}/confirm/${sessionId}`

  if (payResult?.paymentSession?.providerData?.clientSecret && data.publishableKey) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">{formatted}</h2>
          {data.orderId ? (
            <p className="text-muted-foreground text-sm">Order #{data.orderId}</p>
          ) : null}
        </div>
        <StripePayment
          clientSecret={payResult.paymentSession.providerData.clientSecret as string}
          publishableKey={data.publishableKey}
          returnUrl={confirmUrl}
        />
      </div>
    )
  }

  if (payResult?.paymentSession?.providerData?.reference) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-xl font-bold">{formatted}</h2>
        </div>
        <ReferencePayment
          entity={payResult.paymentSession.providerData.entity as string | undefined}
          reference={payResult.paymentSession.providerData.reference as string}
          returnUrl={data.orderId ? confirmUrl : undefined}
        />
      </div>
    )
  }

  if (data.state === "complete") {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h2 className="text-lg font-semibold text-green-600">Payment complete</h2>
        <p className="text-muted-foreground text-sm">Thank you for your purchase.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold">{formatted}</h2>
        {data.orderId ? (
          <p className="text-muted-foreground text-sm">Order #{data.orderId}</p>
        ) : null}
        {timeLeft !== null && timeLeft > 0 ? (
          <p className="text-muted-foreground mt-1 text-xs">
            Expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </p>
        ) : null}
      </div>
      <button
        onClick={handlePay}
        disabled={paying}
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-3 font-medium transition-colors disabled:opacity-50"
      >
        {paying ? "Processing..." : `Pay ${formatted}`}
      </button>
    </div>
  )
}
