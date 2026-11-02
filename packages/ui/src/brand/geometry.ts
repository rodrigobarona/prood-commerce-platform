/**
 * Prood logo geometry, the single source for every rendering of the brand:
 * the React logo components, app icons and Open Graph images.
 *
 * Wordmark grid: x-height 24, stroke 5.5, ascender/descender 10.
 * Mark grid: 32 × 32 hanging roof tile, flat at the head and round at the foot,
 * the same shape as the eave. The wordmark's own "p" runs off its lower edge.
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
export const markTilePath = `M0 0h${markSize}v16a16 16 0 0 1 ${-markSize} 0Z`

const markStem = 5.04
export const markGlyphPaths = [
  `M5 5h${markStem}V30.85A16 16 0 0 1 5 27.62Z`,
  ring(16, 16, 11, 11 - markStem),
] as const

/**
 * The key: the wordmark's ring for a bow, its stroke for a shaft, and two tiles
 * off the eave for the bit, so it can only be Prood's. Drawn lying flat, bit down.
 */
function tile(x: number, y: number, radius: number) {
  return `M${x} ${y}h${2 * radius}a${radius} ${radius} 0 0 1 ${-2 * radius} 0Z`
}

const shaftTop = outer - stroke / 2
const shaftBottom = shaftTop + stroke

export const keySize = { width: 62, height: 24 } as const
export const keyPaths = [
  ring(outer, outer, outer, inner),
  bar(2 * outer - 1, shaftTop, keySize.width - 2 * outer + 1, stroke),
  tile(38, shaftBottom - 0.5, 5),
  tile(51, shaftBottom - 0.5, 5),
] as const

/** Lockup: mark, 8-unit gap, and a wordmark that leads, its x-height 0.45 × the mark. */
export const lockup = {
  width: 115,
  height: 32,
  wordmarkScale: 0.6,
  wordmarkX: 40,
  wordmarkY: 8.8,
} as const
