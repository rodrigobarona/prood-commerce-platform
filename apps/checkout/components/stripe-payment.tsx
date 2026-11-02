"use client"

import { useEffect, useMemo, useState } from "react"
import { useTheme } from "next-themes"
import { loadStripe, type Appearance } from "@stripe/stripe-js"
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Skeleton } from "@prood/ui/components/skeleton"

export const CARD_UNAVAILABLE = "Card payment isn't available right now. You haven't been charged."

// Stripe's iframe can't read our custom properties, so these restate neutral.css in sRGB.
const LIGHT = {
  colorPrimary: "#171717",
  colorBackground: "#ffffff",
  colorText: "#0a0a0a",
  colorTextSecondary: "#737373",
  colorDanger: "#c8102e",
}
const DARK = {
  colorPrimary: "#fafafa",
  colorBackground: "#171717",
  colorText: "#fafafa",
  colorTextSecondary: "#a3a3a3",
  colorDanger: "#f87171",
}

function stripeAppearance(dark: boolean): Appearance {
  return {
    theme: dark ? "night" : "stripe",
    variables: {
      ...(dark ? DARK : LIGHT),
      fontFamily: "Inter, system-ui, sans-serif",
      fontSizeBase: "16px",
      borderRadius: "6px",
    },
  }
}

export interface CardWayOut {
  /** Goes back to the session's other methods. Omit when it has none. */
  onChooseAnother?: () => void
  /** The store, for a shopper with nowhere else to pay. */
  storeHref?: string | null
}

function CardUnavailable({ reason, onChooseAnother, storeHref }: CardWayOut & { reason: unknown }) {
  useEffect(() => {
    console.error("[checkout] Stripe couldn't load", reason)
  }, [reason])

  return (
    <div className="flex flex-col gap-4">
      <p role="alert">{CARD_UNAVAILABLE}</p>
      <div className="flex flex-col gap-3">
        {onChooseAnother ? (
          <CommerceButton type="button" onClick={onChooseAnother}>
            Choose another way to pay
          </CommerceButton>
        ) : null}
        <CommerceButton
          type="button"
          variant={onChooseAnother ? "outline" : "default"}
          onClick={() => window.location.reload()}
        >
          Try again
        </CommerceButton>
        {storeHref ? (
          <a
            href={storeHref}
            className="text-muted-foreground hover:text-foreground self-center py-2 text-sm underline underline-offset-4"
          >
            Back to the store
          </a>
        ) : null}
      </div>
    </div>
  )
}

function PaymentForm({ dark, ...wayOut }: CardWayOut & { dark: boolean }) {
  const checkoutState = useCheckoutElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const checkout = checkoutState.type === "success" ? checkoutState.checkout : null

  useEffect(() => {
    checkout?.changeAppearance(stripeAppearance(dark))
  }, [checkout, dark])

  if (checkoutState.type === "loading") {
    return (
      <div role="status" className="flex flex-col gap-3">
        <Skeleton className="h-40 rounded-xl" />
        <p className="text-muted-foreground text-sm">Loading payment form...</p>
      </div>
    )
  }

  if (!checkout) {
    return <CardUnavailable reason={checkoutState.type === "error" ? checkoutState.error : null} {...wayOut} />
  }

  const confirmable = checkout
  const formattedTotal = confirmable.total.total.amount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await confirmable.confirm()
    if (result.type === "error") {
      setError(result.error.message ?? "Your payment didn't go through. You haven't been charged. Try again.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <CommerceButton type="submit" disabled={!confirmable.canConfirm || loading} className="w-full">
        {loading ? "Processing..." : `Pay ${formattedTotal}`}
      </CommerceButton>
    </form>
  )
}

export function StripePayment({
  clientSecret,
  publishableKey,
  ...wayOut
}: CardWayOut & {
  clientSecret: string
  publishableKey: string
}) {
  const { resolvedTheme } = useTheme()
  const dark = resolvedTheme === "dark"
  const [loadError, setLoadError] = useState<unknown>(null)

  const stripePromise = useMemo(
    () =>
      loadStripe(publishableKey).catch((err: unknown) => {
        setLoadError(err)
        return null
      }),
    [publishableKey],
  )
  // Read once: a provider's options can't change, so PaymentForm follows the theme after.
  const [options] = useState(() => ({
    clientSecret,
    elementsOptions: { appearance: stripeAppearance(dark) },
  }))

  if (loadError) return <CardUnavailable reason={loadError} {...wayOut} />

  return (
    <CheckoutElementsProvider stripe={stripePromise} options={options}>
      <PaymentForm dark={dark} {...wayOut} />
    </CheckoutElementsProvider>
  )
}
