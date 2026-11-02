import type * as React from "react"

import { keyPaths, keySize } from "@prood/ui/brand/geometry"
import { cn } from "@prood/ui/lib/utils"

type KeyMarkProps = Omit<React.ComponentProps<"svg">, "children" | "viewBox" | "hanging"> & {
  /** Hang it from its bow, as on a key board. By default it lies flat, bit down. */
  hanging?: boolean
  /** Accessible name. Decorative by default: the key is a motif, not a logo. */
  title?: string | null
  /** The poster key: a shorter shank, one groove, and a bit cut in stepped teeth. Lies flat. */
  cut?: boolean
}

/** The poster key keeps the wordmark's ring and stroke, in the key's own units. */
const cutSize = { width: 50, height: keySize.height } as const
const cutPaths = [
  keyPaths[0],
  "M23 9.25H48L50 11.25V14.75H46.5V17.5H43.5V21.5H39.5V18.5H36.5V21.5H32.5V14.75H23ZM27 11.65V12.35H44V11.65Z",
] as const

/**
 * Prood's key, drawn from the wordmark's ring and stroke with two tiles for its
 * bit. Filled with `currentColor`. Size it by height or width, never both.
 */
export function KeyMark({ hanging = false, title = null, cut = false, className, ...props }: KeyMarkProps) {
  const { width, height } = cut ? cutSize : keySize
  const paths = cut ? cutPaths : keyPaths
  const upright = hanging && !cut
  return (
    <svg
      viewBox={upright ? `0 0 ${height} ${width}` : `0 0 ${width} ${height}`}
      fill="currentColor"
      className={cn("shrink-0", className)}
      {...(title === null ? { "aria-hidden": true } : { role: "img", "aria-label": title })}
      {...props}
    >
      <g transform={upright ? `rotate(90 ${height / 2} ${height / 2})` : undefined}>
        {paths.map((d) => (
          <path key={d} d={d} fillRule="evenodd" />
        ))}
      </g>
    </svg>
  )
}
