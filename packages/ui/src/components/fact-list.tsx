import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/** Label and value pairs: the facts column of a detail page. */
export function FactList({ className, children }: { className?: string; children: ReactNode }) {
  return <dl className={cn("flex flex-col gap-3 text-sm", className)}>{children}</dl>
}

export function Fact({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right wrap-break-word">{children}</dd>
    </div>
  )
}
