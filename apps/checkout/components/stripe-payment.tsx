"use client"

import { useState, useMemo } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  CheckoutElementsProvider,
  PaymentElement,
  useCheckoutElements,
} from "@stripe/react-stripe-js/checkout"
import { Button } from "@prood/ui/components/button"

function PaymentForm() {
  const checkoutState = useCheckoutElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (checkoutState.type === "loading") {
    return <div className="text-muted-foreground py-4 text-center text-sm">Loading payment form...</div>
  }

  if (checkoutState.type === "error") {
    return <p className="text-destructive text-sm">{checkoutState.error.message}</p>
  }

  const { checkout } = checkoutState
  const formattedTotal = checkout.total.total.amount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await checkout.confirm()
    if (result.type === "error") {
      setError(result.error.message ?? "Payment failed")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={!checkout.canConfirm || loading} className="w-full">
        {loading ? "Processing..." : `Pay ${formattedTotal}`}
      </Button>
    </form>
  )
}

export function StripePayment({
  clientSecret,
  publishableKey,
}: {
  clientSecret: string
  publishableKey: string
}) {
  const stripePromise = useMemo(() => loadStripe(publishableKey), [publishableKey])

  return (
    <CheckoutElementsProvider stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm />
    </CheckoutElementsProvider>
  )
}
