import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/** The hard-to-undo action on a page, kept apart from the work and at the bottom. */
export function DangerZone({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode
  description: ReactNode
  action: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-destructive/25 bg-card p-5 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="font-sans text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 max-w-prose text-sm text-pretty text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </section>
  )
}
