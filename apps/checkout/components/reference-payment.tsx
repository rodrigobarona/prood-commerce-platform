"use client"

import { CommerceButton } from "@prood/ui/components/commerce-button"
import { MultibancoDetails } from "@prood/ui/components/multibanco-details"

export function ReferencePayment({
  entity,
  reference,
  amount,
  expiresAt,
  confirmUrl,
}: {
  entity?: string
  reference: string
  amount: string
  expiresAt?: string
  confirmUrl: string
}) {
  return (
    <div className="flex flex-col gap-4">
      <MultibancoDetails
        entity={entity}
        reference={reference}
        amount={amount}
        expiresAt={expiresAt}
        heading={
          <h2 data-step-heading tabIndex={-1} className="font-sans text-base font-medium outline-none">
            Pay by Multibanco
          </h2>
        }
      />
      <CommerceButton asChild variant="outline">
        <a href={confirmUrl}>View your order</a>
      </CommerceButton>
    </div>
  )
}
