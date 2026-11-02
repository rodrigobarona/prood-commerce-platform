import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@prood/ui/lib/utils"

/** A row of headline numbers, joined by hairlines. Use at the top of overview pages. */
export function StatGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <dl className={cn("grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4", className)}>
      {children}
    </dl>
  )
}

export function Stat({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  /** The list behind the number. The whole tile becomes the link. */
  href?: string
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col gap-1 bg-card p-5 focus-within:ring-2 focus-within:ring-ring focus-within:ring-inset",
        href && "transition-colors duration-120 hover:bg-muted/50"
      )}
    >
      <dt className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        {href ? (
          <Link href={href} className="outline-none after:absolute after:inset-0">
            {label}
          </Link>
        ) : (
          label
        )}
        {icon ? <span className="text-muted-foreground [&_svg]:size-4">{icon}</span> : null}
      </dt>
      <dd className="font-heading text-[1.75rem] leading-9 font-medium tracking-[-0.02em] tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
    </div>
  )
}
