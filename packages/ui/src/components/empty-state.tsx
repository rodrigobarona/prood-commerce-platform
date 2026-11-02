import type { ReactNode } from "react"
import Link from "next/link"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { cn } from "@prood/ui/lib/utils"

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  /** Use `h1` when the empty state is all the page has to say. */
  headingLevel?: "h1" | "h2" | "h3"
  description?: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
  children?: ReactNode
}

export function EmptyState({
  icon,
  title,
  headingLevel: Heading = "h2",
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-20 text-center",
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground [&>svg]:size-8">{icon}</div> : null}
      <Heading className="text-display-sm text-balance">{title}</Heading>
      {description ? (
        <p className="text-muted-foreground max-w-sm text-pretty">{description}</p>
      ) : null}
      {actionLabel ? (
        actionHref ? (
          <CommerceButton asChild className="mt-3">
            <Link href={actionHref} onClick={onAction}>
              {actionLabel}
            </Link>
          </CommerceButton>
        ) : (
          <CommerceButton className="mt-3" onClick={onAction}>
            {actionLabel}
          </CommerceButton>
        )
      ) : null}
      {children}
    </div>
  )
}
