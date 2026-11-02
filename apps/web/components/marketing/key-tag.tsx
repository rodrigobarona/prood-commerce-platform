import type { ReactNode } from "react"

import { KeyMark } from "@prood/ui/components/key-mark"
import { cn } from "@prood/ui/lib/utils"

/** Square at the foot, chamfered at the head, punched for the string. */
const TAG = {
  clipPath: "polygon(2.25rem 0, calc(100% - 2.25rem) 0, 100% 2.25rem, 100% 100%, 0 100%, 0 2.25rem)",
  WebkitMask: "radial-gradient(circle 0.5rem at 50% 1.625rem, #0000 97%, #000)",
  mask: "radial-gradient(circle 0.5rem at 50% 1.625rem, #0000 97%, #000)",
} as const

/** A shipping tag with an eyelet: Paper on the key board, Telha where it stands alone on the page. */
export function KeyTag({
  telha = false,
  className,
  children,
}: {
  telha?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn("drop-shadow-xl drop-shadow-ink/40", className)}>
      <article
        style={TAG}
        className={cn("relative px-6 pt-14 pb-6", telha ? "surface-telha" : "surface-paper bg-paper text-ink")}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-3.5 left-1/2 size-6 -translate-x-1/2 rounded-full border-[3px]",
            telha ? "border-paper" : "border-telha"
          )}
        />
        {children}
      </article>
    </div>
  )
}

/** Hangs a key and its tag from one nail: `drop` is how far the tag falls. */
export function HungKey({
  drop,
  keyClassName,
  string = "text-paper/70",
  className,
  children,
}: {
  drop: string
  keyClassName?: string
  /** The string's color: it hangs over whatever is behind it. */
  string?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div style={{ paddingTop: drop }} className={cn("relative", className)}>
      <svg
        aria-hidden
        viewBox="0 0 12 100"
        preserveAspectRatio="none"
        className={cn("absolute top-0 left-1/2 z-10 w-3 -translate-x-1/2", string)}
        style={{ height: `calc(${drop} + 1.625rem)` }}
      >
        <path d="M6 0 L1 100 M6 0 L11 100" fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <KeyMark
        hanging
        className={cn(
          "absolute -top-4 left-1/2 z-20 ml-1 w-9 origin-[1.125rem_1.125rem] -rotate-[9deg] text-telha drop-shadow-md drop-shadow-ink/50",
          keyClassName
        )}
      />
      {children}
    </div>
  )
}
