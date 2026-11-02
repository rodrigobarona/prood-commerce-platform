import type { ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

/**
 * `sizes` for the `aside` photograph, which is `object-cover` in a full-height
 * slot: a 3:2 frame has to be 150% of the viewport's height wide to fill it
 * without upscaling, more than the column it sits in on most screens.
 */
export const AUTH_ASIDE_SIZES = "(min-width: 1024px) max(55vw, 150vh), 1px"

/**
 * Sign-in, sign-up and onboarding: the form on Paper beside a full-height
 * photograph. `aside` is the image; on phones it collapses away so the form
 * comes first.
 */
export function AuthShell({
  logo,
  aside,
  footer,
  className,
  children,
}: {
  logo?: ReactNode
  aside?: ReactNode
  footer?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]", className)}>
      <div className="flex flex-col px-6 py-8 sm:px-10">
        {logo ? <header className="shrink-0">{logo}</header> : null}
        <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">{children}</main>
        {footer ? <footer className="shrink-0 text-xs text-muted-foreground">{footer}</footer> : null}
      </div>
      {aside ? <aside className="relative hidden overflow-hidden bg-ink lg:block">{aside}</aside> : null}
    </div>
  )
}
