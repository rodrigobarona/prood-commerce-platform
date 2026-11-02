import { useId } from "react"

import { cn } from "@prood/ui/lib/utils"

/** The solid course the tiles hang from, as a share of the radius. */
const BAND = 0.4
/** The wordmark's stroke against its ring's outer radius (5.5 on 12). */
const RING = 5.5 / 12

/**
 * Prood's structural motif: the eave of a Portuguese roof, or a shop awning.
 * One course of half-round tiles, drawn from the wordmark's ring, always hanging
 * downward from the section above. A hairline stroke blunts the point where two
 * tiles meet, so the gaps never read as spikes.
 *
 * Between two flat sections, sit it at the top of the lower one and color it
 * with the upper one (`text-background`). Under a photograph or film there's no
 * flat color to hang, so pass `awning`: sit it at the bottom of the photograph,
 * color it with the section below, and a Telha awning hangs over that section.
 */
export function TileEdge({
  size = 28,
  awning = false,
  className,
}: {
  /** Tile radius in px. Two radii make one tile. */
  size?: number
  /** A Telha course over the page, for the bottom of a photograph. */
  awning?: boolean
  className?: string
}) {
  const id = useId()
  const r = size
  const band = awning ? Math.round(size * BAND) : 0
  const height = band + r
  const tile = awning ? "var(--telha)" : "currentColor"
  return (
    <svg aria-hidden width="100%" height={height} className={cn("pointer-events-none block", className)}>
      <defs>
        <pattern id={id} width={2 * r} height={height} patternUnits="userSpaceOnUse">
          {awning ? <rect width={2 * r} height={height} fill="currentColor" /> : null}
          <path
            d={`M0 0H${2 * r}V${band}a${r} ${r} 0 0 1 ${-2 * r} 0Z`}
            style={{ fill: tile, stroke: tile }}
            strokeWidth="1.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height={height} fill={`url(#${id})`} />
    </svg>
  )
}

/**
 * A roof seen from the street, for Ink and Telha panels: courses of tiles in
 * straight columns, hanging downward, every other course tinted with
 * `currentColor`. Each course is as deep as the wordmark's ring is thick against
 * its radius, so it reads as the ring and not as scales. Keep it faint.
 */
export function TileField({ size = 48, className }: { size?: number; className?: string }) {
  const id = useId()
  const r = size
  const course = Math.round(size * RING)
  return (
    <svg aria-hidden width="100%" height="100%" className={cn("pointer-events-none absolute inset-0", className)}>
      <defs>
        <pattern id={id} width={2 * r} height={2 * course} patternUnits="userSpaceOnUse">
          <path
            d={`M0 ${-r}a${r} ${r} 0 0 0 ${2 * r} 0v${course}a${r} ${r} 0 0 1 ${-2 * r} 0Z`}
            fill="currentColor"
          />
          <path
            d={`M0 ${-r + 2 * course}a${r} ${r} 0 0 0 ${2 * r} 0v${course}a${r} ${r} 0 0 1 ${-2 * r} 0Z`}
            fill="currentColor"
          />
          <path
            d={`M0 ${-r + 4 * course}a${r} ${r} 0 0 0 ${2 * r} 0v${course}a${r} ${r} 0 0 1 ${-2 * r} 0Z`}
            fill="currentColor"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}
