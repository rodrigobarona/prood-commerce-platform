/**
 * The Prood grade: one warm, slightly matte light. Applied to every photo and
 * film so stock from different shoots reads as one.
 *
 * `gradePixel` is the only definition. Photos run it per pixel and film runs it
 * through a 3D LUT baked from it, so stills and film can't drift apart.
 */
import sharp from "sharp"

/** Lifted blacks and held-back whites: the matte. */
const BLACK = 0.06
const WHITE = 0.94
/** Above this tone highlights roll off, which brings high-key frames into line. */
const SHOULDER = 0.68
const CONTRAST = 0.38

/** Colour is cut across the board, then outliers are compressed past a knee. Skin sits below the knee. */
const SATURATION = 0.86
const CHROMA_KNEE = 0.36
const CHROMA_SLOPE = 0.5

const smooth = (edge0, edge1, x) => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/** 1 inside [from, to], fading to 0 over `soft` degrees either side. */
const hueBand = (hue, from, to, soft) => smooth(from - soft, from, hue) * (1 - smooth(to, to + soft, hue))

function hueOf(r, g, b, max, chroma) {
  if (max === r) return (((g - b) / chroma + 6) % 6) * 60
  if (max === g) return ((b - r) / chroma + 2) * 60
  return ((r - g) / chroma + 4) * 60
}

function tone(x) {
  const curved = x + CONTRAST * (x * x * (3 - 2 * x) - x)
  const rolled =
    curved <= SHOULDER
      ? curved
      : SHOULDER + (1 - SHOULDER) * (1 - Math.exp((-2 * (curved - SHOULDER)) / (1 - SHOULDER)))
  return BLACK + (WHITE - BLACK) * rolled
}

/** Maps one sRGB colour, channels in 0..1. */
export function gradePixel(r, g, b) {
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
  const max = Math.max(r, g, b)
  const chroma = max - Math.min(r, g, b)

  let keep = SATURATION
  if (chroma > 0.001) {
    const hue = hueOf(r, g, b, max, chroma)
    if (chroma > CHROMA_KNEE) keep *= (CHROMA_KNEE + (chroma - CHROMA_KNEE) * CHROMA_SLOPE) / chroma
    keep *= 1 - 0.5 * hueBand(hue, 165, 255, 20) // turquoise and blue doors
    keep *= 1 - 0.25 * hueBand(hue, 80, 165, 20) // foliage
    keep *= 1 - 0.3 * hueBand(hue < 30 ? hue + 360 : hue, 330, 375, 15) * smooth(0.45, 0.8, chroma) // reds
    keep *= 1 - 0.3 * hueBand(hue, 8, 40, 6) * smooth(0.5, 0.85, chroma) // hot orange, clear of skin
  }

  const shade = tone(luma)
  const warmR = 1.025 + 0.015 * shade
  const warmB = 0.945 - 0.04 * shade
  const channel = (value, gain) => Math.min(1, tone(luma + (value - luma) * keep) * gain)
  return [channel(r, warmR), channel(g, 1), channel(b, warmB)]
}

/** Grades a sharp pipeline and returns a new one holding the result. */
export async function gradePhoto(image) {
  const { data, info } = await image.removeAlpha().toColourspace("srgb").raw().toBuffer({ resolveWithObject: true })
  const lookup = new Float64Array(256).map((_, i) => i / 255)
  for (let i = 0; i < data.length; i += 3) {
    const [r, g, b] = gradePixel(lookup[data[i]], lookup[data[i + 1]], lookup[data[i + 2]])
    data[i] = Math.round(r * 255)
    data[i + 1] = Math.round(g * 255)
    data[i + 2] = Math.round(b * 255)
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
}

/** The same grade as a .cube 3D LUT, for ffmpeg's lut3d filter. */
export function gradeCube(size = 33) {
  const rows = [`LUT_3D_SIZE ${size}`]
  const step = (i) => i / (size - 1)
  for (let b = 0; b < size; b++) {
    for (let g = 0; g < size; g++) {
      for (let r = 0; r < size; r++) {
        rows.push(
          gradePixel(step(r), step(g), step(b))
            .map((value) => value.toFixed(6))
            .join(" ")
        )
      }
    }
  }
  return `${rows.join("\n")}\n`
}
