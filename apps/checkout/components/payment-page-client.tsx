"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { StoreHint } from "@prood/checkout-host"
import { ArrowLeftIcon, BankIcon, CreditCardIcon, DeviceMobileIcon, WarningCircleIcon, type Icon } from "@phosphor-icons/react"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { RadioGroup, RadioGroupItem } from "@prood/ui/components/radio-group"
import { Skeleton } from "@prood/ui/components/skeleton"
import { toPortugueseMobile, type PaymentMethodKind } from "@prood/types"
import { withBasePath } from "@/lib/base-path"
import { formatAmount } from "@/lib/format-amount"
import type { OrderSummary, SessionDetails } from "@/lib/session-details"
import { storeHome, storeUrl } from "@/lib/store-url"
import { useCheckoutContext } from "./checkout-context"
import { MbWayPayment, type MbWayEnd } from "./mbway-payment"
import { OrderLines, PaymentReceipt } from "./payment-receipt"
import { StatusPanel, StoreContact, onwardProps } from "./status-panel"
import { StripePayment } from "./stripe-payment"
import { ReferencePayment } from "./reference-payment"

const PAY_ERROR = "We couldn't start your payment. You haven't been charged. Try again, or contact the store."
const LOAD_ERROR = "This payment page can't read its records right now. If you've already paid, you don't need to pay again."
const NO_METHODS_ERROR = "This store can't take payment here right now. You haven't been charged."
const EXPIRED_ERROR = "This payment link has expired. You haven't been charged. Go back to the store to order again."
const BUSY_ERROR = "Your payment is already starting. Wait a moment, then reload this page."
const STUCK_ERROR = "We couldn't continue this payment. If you already paid, you don't need to pay again. Contact the store."
const FAILED_NOTICE = "Your last payment didn't go through. Try again, or choose another way to pay."
const TIMED_OUT_NOTICE =
  "The MB WAY request expired. You haven't been charged. Check your number and try again, or choose another way to pay."
const SWITCH_ERROR = "We couldn't change how this order is paid. You haven't been charged. Contact the store."
const PHONE_ERROR = "Enter a Portuguese mobile number, like 912 345 678."
const PHONE_ERROR_ID = "mbway-phone-error"

const METHODS: Record<PaymentMethodKind, { label: string; hint: string; Icon: Icon }> = {
  card: { label: "Card", hint: "Pay with a credit or debit card.", Icon: CreditCardIcon },
  multibanco: {
    label: "Multibanco",
    hint: "Get a reference to pay at an ATM or in your banking app.",
    Icon: BankIcon,
  },
  mbway: { label: "MB WAY", hint: "Approve the payment in the MB WAY app.", Icon: DeviceMobileIcon },
}

interface SessionData extends SessionDetails {
  sessionId: string
  providerId: string
  publishableKey?: string
  kind: "cs" | "pl"
  state: string
  payable: boolean
  methods: PaymentMethodKind[]
  orderId: string | null
  expiresAt: string | null
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


/** What's being paid, to whom, and the way back to the store. */
function PaymentSummary({
  storeName,
  returnUrl,
  amount,
  email,
  expiry,
  order,
  currency,
}: {
  storeName?: string | null
  returnUrl?: string | null
  amount: string
  email?: string
  expiry?: string
  order?: OrderSummary | null
  currency: string
}) {
  const home = storeHome(returnUrl)
  return (
    <header className="flex flex-col gap-4">
      {home ? (
        <a
          href={home}
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to {storeName ?? "the store"}
        </a>
      ) : null}
      <div className="flex flex-col gap-1">
        <p className="text-muted-foreground text-sm">{storeName ? `Pay ${storeName}` : "Amount to pay"}</p>
        <h1 data-step-heading tabIndex={-1} className="text-display-sm tabular-nums outline-none">
          {amount}
        </h1>
        {email || expiry ? (
          <p className="text-muted-foreground text-sm tabular-nums">
            {[email, expiry].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
      {order?.items.length ? <OrderLines order={order} currency={currency} /> : null}
    </header>
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

export function PaymentPageClient({
  sessionId,
  hint = null,
}: {
  sessionId: string
  /** Who this payment belongs to, from its link, for when the session can't say. */
  hint?: StoreHint | null
}) {
  const [data, setData] = useState<SessionData | null>(null)
  const [loadFailed, setLoadFailed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [expired, setExpired] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethodKind | null>(null)
  const [phone, setPhone] = useState("")
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [cardFailed, setCardFailed] = useState(false)
  const phoneRef = useRef<HTMLInputElement>(null)
  const payIssueRef = useRef<HTMLParagraphElement>(null)
  const { setSession } = useCheckoutContext()

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    fetch(withBasePath(`/api/sessions/${sessionId}`), { signal: controller.signal })
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
        setSession({ storeName: hint?.name ?? null, returnUrl: hint?.home ?? null })
        setLoadFailed(true)
        setLoading(false)
      })
    return () => {
      active = false
      controller.abort()
    }
  }, [sessionId, hint, setSession])

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

  // Whatever ended this screen took focus with it, so the next one's heading gets it.
  const screen = `${data?.state}/${data?.paymentSession?.id}/${data?.payable}/${expired}/${cardFailed}`
  const shownScreenRef = useRef<string | null>(null)
  useEffect(() => {
    if (!data) return
    if (shownScreenRef.current && shownScreenRef.current !== screen) {
      const headings = document.querySelectorAll<HTMLElement>("[data-step-heading]")
      headings[headings.length - 1]?.focus()
    }
    shownScreenRef.current = screen
  }, [data, screen])

  // Pay turns itself off while it works, which drops focus. The field takes it for a bad number.
  useEffect(() => {
    if (payError && payError !== PHONE_ERROR) payIssueRef.current?.focus()
  }, [payError])

  const handleMbWayEnd = useCallback((end: MbWayEnd, payable?: boolean) => {
    setMethod("mbway")
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
      phoneRef.current?.focus()
      return
    }

    setPaying(true)
    setPayError(null)
    try {
      const res = await fetch(withBasePath(`/api/sessions/${sessionId}/pay`), {
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
      if (res.status === 410) {
        setExpired(true)
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
      // A started payment stands until it ends, so the server may answer with the same one.
      if (cardFailed && result.paymentSession?.method === "card") {
        setPayError(SWITCH_ERROR)
        setPaying(false)
        return
      }
      const next = { ...data, ...result }
      if (!canContinue(next)) {
        setPayError(STUCK_ERROR)
        setPaying(false)
        return
      }
      setNotice(null)
      setCardFailed(false)
      setData(next)
      setPaying(false)
    } catch {
      setPayError(PAY_ERROR)
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div aria-hidden className="flex flex-col gap-4">
        <Skeleton className="h-4 w-1/3 rounded-md" />
        <Skeleton className="h-10 w-1/2 rounded-lg" />
        <Skeleton className="mt-4 h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (loadFailed || !data) {
    return (
      <StatusPanel
        tone="neutral"
        title="This payment can't be loaded right now"
        action={
          <>
            <CommerceButton onClick={() => window.location.reload()}>Check again</CommerceButton>
            {hint?.home ? (
              <CommerceButton asChild variant="outline">
                <a href={hint.home}>Back to the store</a>
              </CommerceButton>
            ) : null}
          </>
        }
        contact={<StoreContact email={hint?.email} storeName={hint?.name} />}
      >
        {LOAD_ERROR}
      </StatusPanel>
    )
  }

  const backToStore = storeUrl(data)
  const backToStoreButton = backToStore ? (
    <CommerceButton asChild variant="outline">
      <a href={backToStore}>Back to the store</a>
    </CommerceButton>
  ) : null

  const viewOrderButton = backToStore ? (
    <CommerceButton asChild variant="outline">
      <a href={backToStore}>View your order</a>
    </CommerceButton>
  ) : null

  if (data.state === "complete") {
    return (
      <StatusPanel
        tone="success"
        title="Payment complete"
        details={<PaymentReceipt details={data} />}
        {...onwardProps(viewOrderButton, {
          email: data.storeEmail,
          name: data.storeName,
          orderNumber: data.order?.number,
        })}
      >
        Thank you for your purchase.
      </StatusPanel>
    )
  }

  if (data.state === "pending") {
    return (
      <StatusPanel
        tone="pending"
        title="Payment pending"
        details={<PaymentReceipt details={data} pending />}
        action={viewOrderButton}
        contact={<StoreContact email={data.storeEmail} storeName={data.storeName} />}
      >
        We&apos;re waiting for your payment. We&apos;ll email you when it arrives.
      </StatusPanel>
    )
  }

  const formatted = formatAmount(data.amount, data.currency)
  const started = data.state === "payment" && !cardFailed ? data.paymentSession : null
  const startedData = started?.providerData
  const methods = cardFailed ? data.methods.filter((option) => option !== "card") : data.methods
  const summary = {
    storeName: data.storeName,
    returnUrl: data.returnUrl,
    amount: formatted,
    order: data.order,
    currency: data.currency,
  }
  const heading = <PaymentSummary {...summary} />

  const clientSecret = text(startedData, "clientSecret")
  if (clientSecret && data.publishableKey) {
    return (
      <div className="flex flex-col gap-8">
        {heading}
        <StripePayment
          clientSecret={clientSecret}
          publishableKey={data.publishableKey}
          onChooseAnother={data.methods.some((option) => option !== "card") ? () => setCardFailed(true) : undefined}
          storeHref={backToStore}
        />
      </div>
    )
  }

  const reference = text(startedData, "reference")
  if (reference) {
    return (
      <div className="flex flex-col gap-8">
        {heading}
        <ReferencePayment
          entity={text(startedData, "entity")}
          reference={reference}
          amount={formatted}
          expiresAt={text(startedData, "expiresAt")}
          confirmUrl={withBasePath(`/confirm/${sessionId}`)}
        />
      </div>
    )
  }

  if (started?.method === "mbway") {
    return (
      <div className="flex flex-col gap-8">
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
      <div className="flex flex-col gap-8">
        {heading}
        <CommerceButton asChild className="w-full">
          <a href={started.redirectUrl}>Continue to the payment page</a>
        </CommerceButton>
      </div>
    )
  }

  if (!data.payable) {
    return (
      <StatusPanel
        tone="neutral"
        title="This order can't be paid"
        action={backToStoreButton}
        contact={<StoreContact email={data.storeEmail} storeName={data.storeName} />}
      >
        It&apos;s no longer waiting for payment.
      </StatusPanel>
    )
  }

  if (expired || timeLeft === 0) {
    return (
      <StatusPanel
        tone="neutral"
        title="Payment link expired"
        action={backToStoreButton}
        contact={<StoreContact email={data.storeEmail} storeName={data.storeName} />}
      >
        {EXPIRED_ERROR}
      </StatusPanel>
    )
  }

  const chosen = method && methods.includes(method) ? method : methods[0]
  if (!chosen) {
    return (
      <StatusPanel
        tone="neutral"
        title="Payment not available"
        action={backToStoreButton}
        contact={<StoreContact email={data.storeEmail} storeName={data.storeName} />}
      >
        {NO_METHODS_ERROR}
      </StatusPanel>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <PaymentSummary
        {...summary}
        email={data.customerInfo?.email}
        expiry={
          timeLeft !== null
            ? `Expires in ${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`
            : undefined
        }
      />

      {notice && !payError ? (
        <div role="alert" className="border-destructive/40 bg-destructive/5 flex gap-3 rounded-xl border p-4 text-sm">
          <WarningCircleIcon weight="fill" className="text-destructive size-5 shrink-0" />
          <p>{notice}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <h2 className="font-sans text-base font-medium">How do you want to pay?</h2>
        <RadioGroup
          value={chosen}
          onValueChange={(value) => {
            setMethod(value as PaymentMethodKind)
            setPayError(null)
          }}
          aria-label="How do you want to pay?"
          className="flex flex-col gap-2"
        >
          {methods.map((option) => {
            const { label, hint, Icon } = METHODS[option]
            return (
              <Label
                key={option}
                htmlFor={`method-${option}`}
                className="has-data-checked:border-foreground flex cursor-pointer items-center gap-3 rounded-xl border p-4 font-normal transition-colors"
              >
                <RadioGroupItem value={option} id={`method-${option}`} className="border-input bg-card data-checked:border-primary" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-muted-foreground text-sm">{hint}</span>
                </span>
                <Icon className="text-muted-foreground size-6 shrink-0" />
              </Label>
            )
          })}
        </RadioGroup>
      </div>

      {chosen === "mbway" ? (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mbway-phone">MB WAY phone number</Label>
          <Input
            ref={phoneRef}
            id="mbway-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="912 345 678"
            value={phone}
            aria-invalid={payError === PHONE_ERROR}
            aria-describedby={payError === PHONE_ERROR ? PHONE_ERROR_ID : undefined}
            onChange={(event) => setPhone(event.target.value)}
            className="h-11"
          />
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {payError ? (
          <p
            ref={payIssueRef}
            id={payError === PHONE_ERROR ? PHONE_ERROR_ID : undefined}
            role="alert"
            tabIndex={-1}
            className="text-destructive text-sm outline-none"
          >
            {payError}
          </p>
        ) : null}
        <CommerceButton
          type="button" className="w-full"
          disabled={paying}
          onClick={() => handlePay(chosen)}
        >
          {paying ? "Starting your payment..." : `Pay ${formatted}`}
        </CommerceButton>
      </div>
    </div>
  )
}
