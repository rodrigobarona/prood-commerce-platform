"use client"

import { Button } from "@prood/ui/components/button"
import { CopyButton } from "./copy-button"

const DEADLINE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

function formatDeadline(expiresAt: string): string | null {
  const date = new Date(expiresAt)
  return Number.isNaN(date.getTime()) ? null : DEADLINE_FORMAT.format(date)
}

function Detail({ name, value }: { name: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{name}</span>
      <span className="flex items-center gap-3">
        <span className="font-mono font-medium tabular-nums">{value}</span>
        <CopyButton label={`Copy ${name.toLowerCase()}`} value={value} />
      </span>
    </div>
  )
}

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
  const deadline = expiresAt ? formatDeadline(expiresAt) : null

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-5">
      <h3 className="font-semibold">Pay by Multibanco</h3>
      <div className="flex flex-col gap-2 text-sm">
        {entity ? <Detail name="Entity" value={entity} /> : null}
        <Detail name="Reference" value={reference} />
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium tabular-nums">{amount}</span>
        </div>
        {deadline ? (
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Pay by</span>
            <span className="font-medium tabular-nums">{deadline}</span>
          </div>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        Use these details at any Multibanco ATM or in your banking app. We&apos;ll email you when
        the payment arrives.
      </p>
      <Button asChild className="mt-2 w-full">
        <a href={confirmUrl}>I&apos;ve completed payment</a>
      </Button>
    </div>
  )
}
