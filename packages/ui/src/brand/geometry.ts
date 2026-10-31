/**
 * Prood logo geometry, the single source for every rendering of the brand:
 * the React logo components, app icons and Open Graph images.
 *
 * Wordmark grid: x-height 24, stroke 5.5, ascender/descender 10.
 * Mark grid: 32 × 32 tile, the "p" stem runs off the bottom edge like a tag.
 */

function ring(cx: number, cy: number, outer: number, inner: number) {
  return (
    `M${cx - outer} ${cy}a${outer} ${outer} 0 1 0 ${2 * outer} 0a${outer} ${outer} 0 1 0 ${-2 * outer} 0Z` +
    `M${cx - inner} ${cy}a${inner} ${inner} 0 1 1 ${2 * inner} 0a${inner} ${inner} 0 1 1 ${-2 * inner} 0Z`
  )
}

function bar(x: number, y: number, width: number, height: number) {
  return `M${x} ${y}h${width}v${height}h${-width}Z`
}

const stroke = 5.5
const outer = 12
const inner = outer - stroke

/** Each path is filled on its own with `fill-rule="evenodd"` so overlaps stay solid. */
export const wordmarkPaths = [
  bar(0, 0, stroke, 34),
  ring(12, 12, outer, inner),
  bar(30, 0, stroke, 24),
  `M30 12A${outer} ${outer} 0 0 1 42 0v${stroke}A${inner} ${inner} 0 0 0 ${30 + stroke} 12Z`,
  ring(56, 12, outer, inner),
  ring(84, 12, outer, inner),
  ring(112, 12, outer, inner),
  bar(124 - stroke, -10, stroke, 34),
] as const

export const wordmarkViewBox = { x: 0, y: -10, width: 124, height: 44 } as const

export const markSize = 32
export const markRadius = 8
export const markGlyphPaths = [bar(8, 6, 4.4, 26), ring(17, 15, 9, 4.6)] as const

/** Lockup: mark, 8-unit gap, wordmark scaled so its x-height is 0.4 × the mark. */
export const lockup = {
  width: 107,
  height: 32,
  wordmarkScale: 0.54,
  wordmarkX: 40,
  wordmarkY: 9.5,
} as const
