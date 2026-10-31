"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { RadioGroup, RadioGroupItem } from "@prood/ui/components/radio-group"
import { Skeleton } from "@prood/ui/components/skeleton"
import { toPortugueseMobile, type PaymentMethodKind } from "@prood/types"
import { storeUrl } from "@/lib/store-url"
import { useCheckoutContext } from "./checkout-context"
import { MbWayPayment, type MbWayEnd } from "./mbway-payment"
import { StripePayment } from "./stripe-payment"
import { ReferencePayment } from "./reference-payment"

const PAY_ERROR = "We couldn't start your payment. You haven't been charged. Try again, or contact the store."
const LOAD_ERROR = "We couldn't load this payment. You haven't been charged. Reload the page, or contact the store."
const EXPIRED_ERROR = "This payment link has expired. You haven't been charged. Ask the store for a new one."
const BUSY_ERROR = "Your payment is already starting. Wait a moment, then reload this page."
const STUCK_ERROR = "We couldn't continue this payment. If you already paid, you don't need to pay again. Contact the store."
const FAILED_NOTICE = "Your last payment didn't go through. Try again, or choose another way to pay."
const TIMED_OUT_NOTICE = "The MB WAY request timed out. You haven't been charged. Try again."
const PHONE_ERROR = "Enter a Portuguese mobile number, like 912 345 678."

const METHOD_LABELS: Record<PaymentMethodKind, string> = {
  card: "Card",
  multibanco: "Multibanco",
  mbway: "MB WAY",
}

function formatAmount(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(amount)
  } catch {
    return `${amount} ${currency}`
  }
}

interface SessionData {
  sessionId: string
  providerId: string
  publishableKey?: string
  kind: "cs" | "pl"
  state: string
  payable: boolean
  methods: PaymentMethodKind[]
  amount: number
  currency: string
  orderId: string | null
  expiresAt: string | null
  storeName?: string | null
  returnUrl?: string | null
  customerInfo?: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  } | null
  paymentSession?: {
    id: string
    status: string
    method?: PaymentMethodKind
    redirectUrl?: string | null
    providerData?: Record<string, unknown> | null
    createdAt: string
  } | null
}

function Notice({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm">{children}</p>
      {action}
    </div>
  )
}

function text(data: Record<string, unknown> | null | undefined, key: string): string | undefined {
  const value = data?.[key]
  return typeof value === "string" ? value : undefined
}

/** Whether a started payment leaves the shopper something to do on this page. */
function canContinue(session: Pick<SessionData, "state" | "paymentSession" | "publishableKey">): boolean {
  if (session.state !== "payment") return true
  const started = session.paymentSession
  const startedData = started?.providerData
  return Boolean(
    (text(startedData, "clientSecret") && session.publishableKey) ||
      text(startedData, "reference") ||
      started?.method === "mbway" ||
      started?.redirectUrl,
  )
}

export function PaymentPageClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<SessionData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethodKind | null>(null)
  const [phone, setPhone] = useState("")
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const { setSession } = useCheckoutContext()

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetch(`/api/sessions/${sessionId}`, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Session request failed (${r.status})`)
        return (await r.json()) as SessionData
      })
      .then((d) => {
        if (!active) return
        setData(d)
        setPhone(d.customerInfo?.phone ?? "")
        if (d.state === "failed") setNotice(FAILED_NOTICE)
        setSession({
          storeName: d.storeName ?? null,
          returnUrl: d.returnUrl ?? null,
        })
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        setLoadFailed(true)
        setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [sessionId, setSession])

  // The link's clock stops once a payment starts: a reference outlives it.
  const expiresAt = data?.paymentSession ? null : data?.expiresAt
  useEffect(() => {
    if (!expiresAt) return
    const target = new Date(expiresAt).getTime()
    const tick = () => setTimeLeft(Math.max(0, Math.floor((target - Date.now()) / 1000)))
    const first = setTimeout(tick, 0)
    const iv = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(iv)
    }
  }, [expiresAt])

  const handleMbWayEnd = useCallback((end: MbWayEnd, payable?: boolean) => {
    setNotice(end === "timed_out" ? TIMED_OUT_NOTICE : FAILED_NOTICE)
    setData((prev) =>
      prev ? { ...prev, state: "failed", payable: payable ?? prev.payable } : prev,
    )
  }, [])

  async function handlePay(chosen: PaymentMethodKind) {
    if (!data) return
    const mobile = chosen === "mbway" ? toPortugueseMobile(phone) : null
    if (chosen === "mbway" && !mobile) {
      setPayError(PHONE_ERROR)
      return
    }

    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.customerInfo?.email ?? "guest@checkout.local",
          firstName: data.customerInfo?.firstName,
          lastName: data.customerInfo?.lastName,
          phone: mobile ?? data.customerInfo?.phone,
          method: chosen,
        }),
      })
      if (res.status === 409) {
        // The order stopped waiting for payment, so another try can't work.
        setData((prev) => (prev ? { ...prev, payable: false } : prev))
        setPaying(false)
        return
      }
      if (!res.ok) {
        setPayError(res.status === 423 ? BUSY_ERROR : PAY_ERROR)
        setPaying(false)
        return
      }
      const result = (await res.json()) as Partial<SessionData> & { redirectUrl?: string | null }
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl
        return
      }
      const next = { ...data, ...result }
      if (!canContinue(next)) {
        setPayError(STUCK_ERROR)
        setPaying(false)
        return
      }
      setNotice(null)
      setData(next)
      setPaying(false)
    } catch {
      setPayError(PAY_ERROR)
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

  if (loadFailed || !data) {
    return <Notice title="Payment not available">{LOAD_ERROR}</Notice>
  }

  if (data.state === "complete") {
    return <Notice title="Payment complete">Thank you for your purchase.</Notice>
  }

  if (data.state === "pending") {
    return (
      <Notice title="Payment pending">
        We&apos;re waiting for your payment. We&apos;ll email you when it arrives.
      </Notice>
    )
  }

  const formatted = formatAmount(data.amount, data.currency)
  const started = data.state === "payment" ? data.paymentSession : null
  const startedData = started?.providerData
  const heading = (
    <div className="text-center">
      <h2 className="text-xl font-bold tabular-nums">{formatted}</h2>
    </div>
  )

  const clientSecret = text(startedData, "clientSecret")
  if (clientSecret && data.publishableKey) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <StripePayment clientSecret={clientSecret} publishableKey={data.publishableKey} />
      </div>
    )
  }

  const reference = text(startedData, "reference")
  if (reference) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <ReferencePayment
          entity={text(startedData, "entity")}
          reference={reference}
          amount={formatted}
          expiresAt={text(startedData, "expiresAt")}
          confirmUrl={`/confirm/${sessionId}`}
        />
      </div>
    )
  }

  if (started?.method === "mbway") {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <MbWayPayment
          sessionId={sessionId}
          phone={data.customerInfo?.phone}
          startedAt={started.createdAt}
          onEnd={handleMbWayEnd}
        />
      </div>
    )
  }

  if (started?.redirectUrl) {
    return (
      <div className="flex flex-col gap-6">
        {heading}
        <Button asChild className="w-full">
          <a href={started.redirectUrl}>Continue to the payment page</a>
        </Button>
      </div>
    )
  }

  if (!data.payable) {
    const backToStore = storeUrl(data)
    return (
      <Notice
        title="This order can&apos;t be paid"
        action={
          backToStore ? (
            <Button asChild variant="outline" className="mt-1">
              <a href={backToStore}>Back to the store</a>
            </Button>
          ) : null
        }
      >
        It&apos;s no longer waiting for payment. Contact the store for help.
      </Notice>
    )
  }

  if (timeLeft === 0) {
    return <Notice title="Payment link expired">{EXPIRED_ERROR}</Notice>
  }

  const chosen = method ?? data.methods[0]
  if (!chosen) {
    return <Notice title="Payment not available">{LOAD_ERROR}</Notice>
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-xl font-bold tabular-nums">{formatted}</h2>
        {timeLeft !== null ? (
          <p className="text-muted-foreground mt-1 text-xs tabular-nums">
            Expires in {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </p>
        ) : null}
      </div>

      {notice ? <p className="text-muted-foreground text-center text-sm">{notice}</p> : null}

      {data.methods.length > 1 ? (
        <RadioGroup
          value={chosen}
          onValueChange={(value) => {
            setMethod(value as PaymentMethodKind)
            setPayError(null)
          }}
          aria-label="How do you want to pay?"
          className="flex flex-col gap-2"
        >
          {data.methods.map((option) => (
            <Label
              key={option}
              htmlFor={`method-${option}`}
              className="flex cursor-pointer items-center gap-3 rounded-xl border p-4"
            >
              <RadioGroupItem value={option} id={`method-${option}`} />
              {METHOD_LABELS[option]}
            </Label>
          ))}
        </RadioGroup>
      ) : null}

      {chosen === "mbway" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mbway-phone">MB WAY phone number</Label>
          <Input
            id="mbway-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="912 345 678"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
        </div>
      ) : null}

      {payError ? (
        <p role="alert" className="text-destructive text-center text-sm">
          {payError}
        </p>
      ) : null}

      <Button type="button" className="w-full" disabled={paying} onClick={() => handlePay(chosen)}>
        {paying ? "Starting your payment..." : `Pay ${formatted}`}
      </Button>
    </div>
  )
}
