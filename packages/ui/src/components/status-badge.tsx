import type { ReactNode } from "react"

import type { StatusLook } from "@prood/ui/lib/status"
import { cn } from "@prood/ui/lib/utils"

export type StatusTone = "neutral" | "brand" | "success" | "warning" | "danger" | "info"

const dots: Record<StatusTone, string> = {
  neutral: "before:bg-muted-foreground",
  brand: "before:bg-brand",
  success: "before:bg-success",
  warning: "before:bg-warning",
  danger: "before:bg-destructive",
  info: "before:bg-chart-2",
}

const fills: Record<StatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  brand: "bg-brand-subtle text-brand-subtle-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/14 text-warning",
  danger: "bg-destructive/10 text-destructive",
  info: "bg-chart-2/12 text-chart-2",
}

/**
 * Status of a thing: an order, a domain, a provider. The dot and the word carry
 * the meaning together, so it never rests on color alone. Quiet by default, so a
 * `filled` pill always means someone has to act.
 */
export function StatusBadge({
  tone = "neutral",
  filled = false,
  className,
  children,
}: {
  tone?: StatusTone
  filled?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit items-baseline gap-1.5 whitespace-nowrap before:size-1.5 before:self-center before:rounded-full",
        dots[tone],
        filled ? ["h-5.5 items-center rounded-full px-2 text-xs font-medium", fills[tone]] : "text-sm text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  )
}

/** A status from a status map, filled when its look says someone has to act. */
export function Status({ look, className }: { look: StatusLook; className?: string }) {
  return (
    <StatusBadge tone={look.tone} filled={look.needsAction} className={className}>
      {look.label}
    </StatusBadge>
  )
}
