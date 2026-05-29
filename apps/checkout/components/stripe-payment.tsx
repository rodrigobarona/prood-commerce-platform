"use client"

import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js"
import { Button } from "@workspace/ui/components/button"

function PaymentForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)
    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })
    if (stripeError) {
      setError(stripeError.message ?? "Payment failed")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? "Processing..." : "Pay now"}
      </Button>
    </form>
  )
}

export function StripePayment({
  clientSecret,
  publishableKey,
  returnUrl,
}: {
  clientSecret: string
  publishableKey: string
  returnUrl: string
}) {
  const stripePromise = loadStripe(publishableKey)

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm returnUrl={returnUrl} />
    </Elements>
  )
}
