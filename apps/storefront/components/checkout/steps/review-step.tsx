"use client"

import { useState } from "react"
import Link from "next/link"
import { LockSimpleIcon, SpinnerGapIcon } from "@phosphor-icons/react"
import type { Cart, PaymentMethodKind } from "@prood/types"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { cartSaving, formatPrice, includedVat, localized, paymentChoices } from "@prood/ui/lib/commerce"

interface ReviewStepProps {
  /** Stops at the last step: the demo store takes no orders. */
  demo: boolean
  /** Where the demo sends someone who wants a store of their own. */
  signUpUrl?: string
  cart: Cart
  storeEmail?: string | null
  paymentMethods?: readonly PaymentMethodKind[]
  onSubmit: () => Promise<void>
  onBack: () => void
}

/** What comes after this step, from how the store really takes payment. */
function nextStep(demo: boolean, methods: readonly PaymentMethodKind[]): string {
  const choices = paymentChoices(methods)
  if (demo) {
    const elsewhere = choices ? ` A real store would take you to a secure page to pay by ${choices}.` : ""
    return `This is a demo store, so your order stops here and nothing is charged.${elsewhere}`
  }
  return choices ? `Next: pay by ${choices} on a secure page.` : "Next: choose how to pay on a secure page."
}

/** On a phone the summary is folded away, so the whole order is here. From `lg` it sits beside this step. */
export function ReviewStep({ demo, signUpUrl, cart, storeEmail, paymentMethods = [], onSubmit, onBack }: ReviewStepProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
      setSubmitting(false)
    }
  }

  const totals = cart.totals
  const saving = cartSaving(cart)
  const vat = includedVat(totals.tax)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border p-5 text-sm lg:hidden">
        <ul className="flex flex-col gap-2">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span>
                {localized(item.name)}
                {item.variantName ? (
                  <span className="text-muted-foreground"> · {localized(item.variantName)}</span>
                ) : null}
                <span className="text-muted-foreground tabular-nums"> × {item.quantity}</span>
              </span>
              <span className="tabular-nums whitespace-nowrap">{formatPrice(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        {cart.shippingMethod ? (
          <div className="flex justify-between gap-4 border-t pt-3">
            <span>{localized(cart.shippingMethod.name)}</span>
            <span className="tabular-nums">{formatPrice(cart.shippingMethod.price)}</span>
          </div>
        ) : null}
        <div className="flex items-baseline justify-between gap-4 border-t pt-3 text-base">
          <span>Total</span>
          <span className="tabular-nums">{formatPrice(totals.total)}</span>
        </div>
        {saving || vat ? (
          <p className="text-muted-foreground -mt-2">{[saving, vat].filter(Boolean).join(" · ")}</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
          {error}{" "}
          <Link href="/cart" className="underline">
            Back to cart
          </Link>
        </p>
      ) : null}

      <div className="flex gap-3 rounded-xl border p-5 text-sm">
        <LockSimpleIcon aria-hidden className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="flex flex-col gap-1">
          <p>{nextStep(demo, paymentMethods)}</p>
          {demo && signUpUrl ? (
            <a href={signUpUrl} className="text-muted-foreground hover:text-foreground w-fit underline underline-offset-4">
              Start your own store
            </a>
          ) : null}
        </div>
      </div>

      {storeEmail ? (
        <p className="text-muted-foreground text-sm">
          Questions before you order? Email{" "}
          <a href={`mailto:${storeEmail}`} className="hover:text-foreground underline underline-offset-4">
            {storeEmail}
          </a>
        </p>
      ) : null}

      <div className="flex gap-3">
        <CommerceButton type="button" variant="ghost" className="px-2" onClick={onBack}>
          Back
        </CommerceButton>
        <CommerceButton className="flex-1" disabled={submitting || demo} onClick={handleSubmit}>
          {submitting ? (
            <>
              <SpinnerGapIcon className="size-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to payment"
          )}
        </CommerceButton>
      </div>
    </div>
  )
}
