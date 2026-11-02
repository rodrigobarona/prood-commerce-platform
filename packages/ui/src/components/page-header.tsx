import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/**
 * Title block for every dashboard and admin page: one h1, a sentence of
 * context, and the page's primary action on the right.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** A back link, shown above the title on detail pages. */
  back?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("flex flex-col gap-1", className)}>
      {back ? <div className="mb-1 text-sm text-muted-foreground">{back}</div> : null}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-medium tracking-[-0.02em] wrap-anywhere">{title}</h1>
          {description ? <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  )
}
