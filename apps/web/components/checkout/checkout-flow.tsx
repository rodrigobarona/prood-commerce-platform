"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AddressForm, type AddressInput } from "@workspace/ui/components/address-form"
import { Button } from "@workspace/ui/components/button"
import { CheckoutStepper } from "@workspace/ui/components/checkout-stepper"
import { EmptyState } from "@workspace/ui/components/empty-state"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { startCheckout, type CheckoutResult } from "@/app/checkout/actions"
import { StripePayment } from "@/components/checkout/stripe-payment"
import { useCart } from "@/components/providers/cart-provider"

export function CheckoutFlow() {
  const { cart, refresh } = useCart()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState<AddressInput>({})
  const [result, setResult] = useState<CheckoutResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if ((!cart || cart.items.length === 0) && !result) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add something before checking out."
        actionLabel="Browse products"
        actionHref="/products"
      />
    )
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const res = await startCheckout({ email, address })
    setSubmitting(false)
    if (!res.ok) {
      setError(res.error ?? "Checkout failed")
      return
    }
    await refresh()
    setResult(res)
    if (res.redirectUrl) {
      window.location.href = res.redirectUrl
      return
    }
    setStep(1)
  }

  const confirmationHref = result ? `/order-confirmation?orderId=${result.orderId}` : "/"

  return (
    <div className="flex flex-col gap-8">
      <CheckoutStepper
        steps={[
          { id: "info", title: "Details" },
          { id: "payment", title: "Payment" },
        ]}
        current={step}
      />

      {step === 0 ? (
        <form onSubmit={handleAddressSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="checkout-email">Email</Label>
            <Input
              id="checkout-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <AddressForm value={address} onChange={setAddress} />
          {error ? <p className="text-destructive text-sm">{error}</p> : null}
          <Button type="submit" disabled={submitting}>
            {submitting ? "Processing..." : "Continue to payment"}
          </Button>
        </form>
      ) : null}

      {step === 1 && result ? (
        <div className="flex flex-col gap-4">
          {result.clientSecret ? (
            <StripePayment
              clientSecret={result.clientSecret}
              returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}${confirmationHref}`}
            />
          ) : result.reference?.reference ? (
            <div className="flex flex-col gap-2 rounded-2xl border p-4">
              <p className="font-medium">Multibanco reference</p>
              <p className="text-sm">Entity: {result.reference.entity}</p>
              <p className="text-sm">Reference: {result.reference.reference}</p>
              <Button className="mt-3" onClick={() => router.push(confirmationHref)}>
                I&apos;ve completed payment
              </Button>
            </div>
          ) : (
            <Button onClick={() => router.push(confirmationHref)}>Continue</Button>
          )}
        </div>
      ) : null}
    </div>
  )
}
