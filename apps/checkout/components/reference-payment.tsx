"use client"

import { Button } from "@workspace/ui/components/button"

export function ReferencePayment({
  entity,
  reference,
  returnUrl,
}: {
  entity?: string
  reference: string
  returnUrl?: string
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-5">
      <h3 className="font-semibold">Multibanco Payment</h3>
      <div className="flex flex-col gap-1.5 text-sm">
        {entity ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Entity</span>
            <span className="font-mono font-medium">{entity}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Reference</span>
          <span className="font-mono font-medium">{reference}</span>
        </div>
      </div>
      <p className="text-muted-foreground text-xs">
        Use the entity and reference above to complete payment via Multibanco ATM or
        online banking. The payment will be confirmed automatically.
      </p>
      {returnUrl ? (
        <Button asChild className="mt-2 w-full">
          <a href={returnUrl}>I&apos;ve completed payment</a>
        </Button>
      ) : null}
    </div>
  )
}
