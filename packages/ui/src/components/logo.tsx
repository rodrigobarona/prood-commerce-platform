import type * as React from "react"

import {
  lockup,
  markGlyphPaths,
  markRadius,
  markSize,
  wordmarkPaths,
  wordmarkViewBox,
} from "@prood/ui/brand/geometry"
import { cn } from "@prood/ui/lib/utils"

type LogoProps = Omit<React.ComponentProps<"svg">, "children" | "viewBox"> & {
  /** Accessible name. Pass `null` when the logo sits next to visible "Prood" text. */
  title?: string | null
}

function a11y(title: string | null) {
  return title === null
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": title } as const)
}

function MarkShapes() {
  return (
    <>
      <rect
        width={markSize}
        height={markSize}
        rx={markRadius}
        style={{ fill: "var(--brand)" }}
      />
      <g style={{ fill: "var(--brand-foreground)" }}>
        {markGlyphPaths.map((d) => (
          <path key={d} d={d} fillRule="evenodd" />
        ))}
      </g>
    </>
  )
}

function WordmarkShapes() {
  return wordmarkPaths.map((d) => <path key={d} d={d} fillRule="evenodd" />)
}

/** Compact mark: the Telha tile. Use for favicons, avatars and tight spaces. */
export function LogoMark({ title = "Prood", className, ...props }: LogoProps) {
  return (
    <svg
      viewBox={`0 0 ${markSize} ${markSize}`}
      className={cn("size-8 shrink-0", className)}
      {...a11y(title)}
      {...props}
    >
      <MarkShapes />
    </svg>
  )
}

/** Wordmark only, drawn in `currentColor`. */
export function Wordmark({ title = "Prood", className, ...props }: LogoProps) {
  const { x, y, width, height } = wordmarkViewBox
  return (
    <svg
      viewBox={`${x} ${y} ${width} ${height}`}
      fill="currentColor"
      className={cn("h-6 w-auto shrink-0", className)}
      {...a11y(title)}
      {...props}
    >
      <WordmarkShapes />
    </svg>
  )
}

/** Primary lockup: mark plus wordmark. Size it by height, e.g. `className="h-7"`. */
export function Logo({ title = "Prood", className, ...props }: LogoProps) {
  return (
    <svg
      viewBox={`0 0 ${lockup.width} ${lockup.height}`}
      className={cn("h-8 w-auto shrink-0", className)}
      {...a11y(title)}
      {...props}
    >
      <MarkShapes />
      <g
        fill="currentColor"
        transform={`translate(${lockup.wordmarkX} ${lockup.wordmarkY}) scale(${lockup.wordmarkScale})`}
      >
        <WordmarkShapes />
      </g>
    </svg>
  )
}
