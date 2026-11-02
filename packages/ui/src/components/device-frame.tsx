import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/** Browser chrome for showing a real product screen on marketing pages. */
export function BrowserFrame({
  url,
  className,
  children,
}: {
  url: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl shadow-ink/20", className)}>
      <div className="flex h-10 items-center gap-3 border-b border-border px-4">
        <span aria-hidden className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
          <span className="size-2.5 rounded-full bg-muted-foreground/30" />
        </span>
        <span className="truncate rounded-md bg-muted px-3 py-0.5 font-mono text-xs text-muted-foreground">{url}</span>
      </div>
      {children}
    </div>
  )
}

/** Phone chrome for checkout and storefront moments. */
export function PhoneFrame({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("w-full max-w-72 rounded-[2.5rem] bg-ink p-2.5 shadow-2xl shadow-ink/30", className)}>
      <div className="relative overflow-hidden rounded-[2rem] bg-card text-card-foreground">
        <span aria-hidden className="absolute top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rounded-full bg-ink" />
        {children}
      </div>
    </div>
  )
}
