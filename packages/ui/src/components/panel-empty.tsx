import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/**
 * An empty list inside a `Panel`, on the product type scale: what will appear,
 * why it matters and one action. `EmptyState` is the page-sized version for
 * merchant surfaces. The title isn't a heading, so it can't skip a level.
 */
export function PanelEmpty({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col items-center gap-1 px-6 py-12 text-center", className)}>
      {icon ? <div className="mb-2 text-muted-foreground [&>svg]:size-6">{icon}</div> : null}
      <p className="text-sm font-semibold">{title}</p>
      {description ? <p className="max-w-sm text-sm text-pretty text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}
