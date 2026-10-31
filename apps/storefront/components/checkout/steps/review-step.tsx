"use client"

import { useState } from "react"
import Link from "next/link"
import { SpinnerGapIcon } from "@phosphor-icons/react"
import type { Price, ShippingMethod } from "@prood/types"
import { Button } from "@prood/ui/components/button"
import { formatPrice, localized } from "@prood/ui/lib/commerce"
import type { ContactValues, AddressValues } from "../schemas"

interface ReviewStepProps {
  contact: ContactValues
  address: AddressValues
  shippingMethod: ShippingMethod | null
  total: Price
  onSubmit: () => Promise<void>
  onBack: () => void
  onEditStep: (step: number) => void
}

function SectionSummary({
  title,
  onEdit,
  children,
}: {
  title: string
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={onEdit}
        >
          Edit
        </button>
      </div>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}

export function ReviewStep({
  contact,
  address,
  shippingMethod,
  total,
  onSubmit,
  onBack,
  onEditStep,
}: ReviewStepProps) {
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

  return (
    <div className="flex flex-col gap-4">
      <SectionSummary title="Contact" onEdit={() => onEditStep(0)}>
        <p>{contact.email}</p>
        {contact.phone ? <p>{contact.phone}</p> : null}
      </SectionSummary>

      <SectionSummary title="Shipping address" onEdit={() => onEditStep(1)}>
        <p>
          {address.firstName} {address.lastName}
        </p>
        <p>{address.street}</p>
        {address.street2 ? <p>{address.street2}</p> : null}
        <p>
          {[address.city, address.state, address.postalCode]
            .filter(Boolean)
            .join(", ")}
        </p>
        <p>{address.country}</p>
      </SectionSummary>

      {shippingMethod ? (
        <SectionSummary title="Shipping method" onEdit={() => onEditStep(2)}>
          <p className="flex justify-between gap-3">
            <span>{localized(shippingMethod.name)}</span>
            <span className="text-foreground">
              {shippingMethod.price.amount === 0 ? "Free" : formatPrice(shippingMethod.price)}
            </span>
          </p>
        </SectionSummary>
      ) : null}

      <div className="flex justify-between px-1 text-base font-semibold">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}{" "}
          <Link href="/cart" className="underline">
            Back to cart
          </Link>
        </p>
      ) : null}

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button
          className="flex-1"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <>
              <SpinnerGapIcon className="size-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Continue to payment"
          )}
        </Button>
      </div>
    </div>
  )
}
