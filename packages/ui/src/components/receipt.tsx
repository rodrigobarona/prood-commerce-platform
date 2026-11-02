import type { CSSProperties, ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"

const TOOTH = 12

/** Cuts the bottom edge into the teeth of a tear-off till roll. */
const torn: CSSProperties = {
  WebkitMask: `conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${TOOTH}px ${TOOTH / 2}px repeat-x, linear-gradient(#000 0 0) top / 100% calc(100% - ${TOOTH / 2 - 0.5}px) no-repeat`,
  mask: `conic-gradient(from -45deg at bottom, #0000, #000 1deg 89deg, #0000 90deg) bottom / ${TOOTH}px ${TOOTH / 2}px repeat-x, linear-gradient(#000 0 0) top / 100% calc(100% - ${TOOTH / 2 - 0.5}px) no-repeat`,
}

export interface ReceiptLine {
  label: string
  value: ReactNode
  /** Rule above the line and a heavier weight. */
  total?: boolean
  /** Telha, for the line the receipt exists to show. */
  highlight?: boolean
}

/**
 * The signature product fragment: receipt paper is where Prood's Paper comes
 * from. Always paper-on-ink colored, on any surface, in either color scheme.
 * Anything in `children` sits after the lines, on the light tokens.
 */
export function Receipt({
  heading,
  meta,
  lines = [],
  footer,
  className,
  children,
}: {
  heading?: ReactNode
  meta?: ReactNode
  lines?: ReceiptLine[]
  footer?: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <div className={cn("surface-paper w-full max-w-80 drop-shadow-[0_18px_30px_oklch(0.2_0.02_260/0.28)]", className)}>
      <div style={torn} className="bg-paper px-6 pt-6 pb-8 font-mono text-[0.8125rem] leading-6 text-ink">
        {heading ? <p className="text-center font-medium tracking-wide">{heading}</p> : null}
        {meta ? <p className="text-center text-xs text-ink/65">{meta}</p> : null}
        {lines.length > 0 ? (
          <dl className={cn("space-y-0.5 tabular-nums", (heading || meta) && "mt-4 border-t border-dashed border-ink/30 pt-3")}>
            {lines.map((line) => (
              <div
                key={line.label}
                className={cn(
                  "flex items-baseline justify-between gap-6",
                  line.total && "mt-2 border-t border-dashed border-ink/30 pt-2 font-medium",
                  line.highlight && "font-medium text-telha"
                )}
              >
                <dt>{line.label}</dt>
                <dd className="shrink-0">{line.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {children}
        {footer ? <p className="mt-4 text-center text-xs text-ink/65">{footer}</p> : null}
      </div>
    </div>
  )
}
