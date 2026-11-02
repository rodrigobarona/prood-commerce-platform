import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/**
 * The product UI's standard container: a titled, bordered block around a table,
 * list or form. Headers share one height, so panels side by side line up
 * whether or not one carries a button.
 */
export function Panel({
  title,
  description,
  actions,
  flush = false,
  footer,
  className,
  children,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  /** No inner padding, for tables and lists that run to the border. */
  flush?: boolean
  /** The panel's own actions, so they stay with what they act on. */
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card text-card-foreground", className)}>
      {title || actions ? (
        <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-border px-5 py-3">
          <div className="min-w-0">
            {title ? <h2 className="font-sans text-sm font-semibold">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-sm text-pretty text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? (
            // A ghost button's label ends where the panel's content ends, not its invisible padding.
            <div className="flex shrink-0 items-center gap-2 [&>[data-variant=ghost]:last-child]:-mr-3">{actions}</div>
          ) : null}
        </header>
      ) : null}
      <div className={cn(!flush && "p-5")}>{children}</div>
      {footer ? (
        <footer className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3">{footer}</footer>
      ) : null}
    </section>
  )
}
