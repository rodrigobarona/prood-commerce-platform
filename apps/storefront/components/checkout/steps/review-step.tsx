"use client"

import { useState } from "react"
import { SpinnerGapIcon } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import type { ContactValues, AddressValues } from "../schemas"

interface ReviewStepProps {
  contact: ContactValues
  address: AddressValues
  shippingMethodName?: string
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
  shippingMethodName,
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

      {shippingMethodName ? (
        <SectionSummary title="Shipping method" onEdit={() => onEditStep(2)}>
          <p>{shippingMethodName}</p>
        </SectionSummary>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
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
