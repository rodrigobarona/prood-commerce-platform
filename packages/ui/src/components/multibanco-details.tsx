import type { ReactNode } from "react"
import { CopyButton } from "@prood/ui/components/copy-button"

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

/** Copies the bare number; `shown` is how a bank app prints it. */
function Detail({ name, value, shown = value }: { name: string; value: string; shown?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted-foreground text-sm">{name}</dt>
      <dd className="flex items-center gap-3">
        <span className="font-mono text-lg tabular-nums">{shown}</span>
        <CopyButton label={`Copy ${name.toLowerCase()}`} value={value} />
      </dd>
    </div>
  )
}

function Fact({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <dt className="text-muted-foreground">{name}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}

export interface MultibancoDetailsProps {
  entity?: string | null
  reference: string
  /** Formatted, with its currency. */
  amount: string
  expiresAt?: string | null
  /** Stands in for the plain heading, for a page that moves focus to it. */
  heading?: ReactNode
}

/** Everything needed to pay a Multibanco reference, the same on every page that shows one. */
export function MultibancoDetails({ entity, reference, amount, expiresAt, heading }: MultibancoDetailsProps) {
  const deadline = expiresAt ? formatDeadline(expiresAt) : null

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2 rounded-xl border p-5">
        {heading ?? <h2 className="font-sans text-base font-medium">Pay by Multibanco</h2>}
        <dl className="flex flex-col divide-y">
          {entity ? <Detail name="Entity" value={entity} /> : null}
          <Detail
            name="Reference"
            value={reference}
            shown={reference.replace(/(\d{3})(?=\d)/g, "$1 ")}
          />
          <Fact name="Amount">{amount}</Fact>
          {deadline ? <Fact name="Pay by">{deadline}</Fact> : null}
        </dl>
      </section>
      <div className="flex flex-col gap-1 text-sm">
        <p className="font-medium">Save these details. We won&apos;t email them.</p>
        <p className="text-muted-foreground">
          Use them at any Multibanco ATM or in your banking app. We&apos;ll email you when the
          payment arrives.
        </p>
      </div>
    </div>
  )
}
