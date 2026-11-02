import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"

import { cn } from "@prood/ui/lib/utils"

/** The vertical rhythm of a product page. The app shell sets the width. */
export function PageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex w-full min-w-0 flex-col gap-6", className)}>{children}</div>
}

/** Detail pages at `lg`: the work on the left, the facts on the right. */
export function DetailLayout({ main, aside }: { main: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">{main}</div>
      <div className="flex min-w-0 flex-col gap-6">{aside}</div>
    </div>
  )
}

/** The `back` link of a `PageHeader`. */
export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="-my-2.5 inline-flex items-center gap-1.5 rounded-sm py-2.5 outline-none hover:text-foreground md:my-0 md:py-0 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft className="size-4" aria-hidden />
      {children}
    </Link>
  )
}
