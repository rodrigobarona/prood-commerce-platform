/**
 * Builds the brand media library from curation.json.
 *
 *   pnpm --filter @prood/media media:build            everything
 *   pnpm --filter @prood/media media:build -- photos  photos only
 *   pnpm --filter @prood/media media:build -- film    hero film only
 *
 * Fetches each asset from Pexels, applies the Prood grade, uploads it to the
 * public R2 bucket under brand/ and rewrites src/library.json. Reads
 * PEXELS_API_KEY and the S3_* variables from the repo .env.local. Originals are
 * cached in the OS temp directory, so a rerun only redoes the grade.
 *
 * Curation entries can carry a `crop`: left, top, width and height as fractions
 * of the source. Use it to keep marks out of frame; on a clip it applies to both
 * cuts. A clip's `focus` is the horizontal centre of the tall cut, as a fraction
 * of the frame, and `posterAt` picks the poster frame, in seconds into that clip.
 * A clip's `tallCrop` replaces `crop` on the tall cut alone, for a subject the two
 * cuts need to place differently. `soften` calms a still that arrives over-sharpened.
 */
/* global process, Buffer */
import { execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { AwsClient } from "aws4fetch"
import sharp from "sharp"

import { gradeCube, gradePhoto } from "./grade.mjs"

const ROOT = fileURLToPath(new URL("..", import.meta.url))
const LIBRARY = path.join(ROOT, "src/library.json")
const CACHE = path.join(tmpdir(), "prood-media-originals")
const PREFIX = "brand/v1"
const MAX_WIDTH = 2400
const WIDE = { width: 1920, height: 1080, crf: 26, maxrate: "2000k" }
const TALL = { width: 810, height: 1440, crf: 24, maxrate: "2000k" }
/** 4K sources, so the tall cut isn't upscaled from a 1080p crop. */
const MIN_SOURCE_WIDTH = 3000

mkdirSync(CACHE, { recursive: true })
const curation = JSON.parse(readFileSync(path.join(ROOT, "curation.json"), "utf8"))
const target = process.argv.at(-1)

/** Assets are served immutable, so a changed file needs a new key. */
function hashed(name, ext, body) {
  const hash = createHash("sha256").update(body).digest("hex").slice(0, 8)
  return `${PREFIX}/${name}-${hash}.${ext}`
}

function env(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set (.env.local)`)
  return value
}

const r2 = new AwsClient({
  accessKeyId: env("S3_ACCESS_KEY_ID"),
  secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
  service: "s3",
  region: "auto",
})

async function upload(key, body, contentType) {
  const url = `${env("S3_ENDPOINT").replace(/\/$/, "")}/${env("S3_BUCKET")}/${key}`
  const res = await r2.fetch(url, {
    method: "PUT",
    body,
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=31536000, immutable",
    },
  })
  if (!res.ok) throw new Error(`upload ${key}: ${res.status} ${await res.text()}`)
}

async function pexels(pathname) {
  const res = await fetch(`https://api.pexels.com${pathname}`, {
    headers: { Authorization: env("PEXELS_API_KEY") },
  })
  if (!res.ok) throw new Error(`Pexels ${res.status} for ${pathname}`)
  return res.json()
}

async function cached(name, url) {
  const file = path.join(CACHE, name)
  if (!existsSync(file)) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`download ${res.status} ${url}`)
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  return file
}

async function blurOf(input) {
  const tiny = await sharp(input).resize(24).jpeg({ quality: 50 }).toBuffer()
  return `data:image/jpeg;base64,${tiny.toString("base64")}`
}

function extract(crop, width, height) {
  return {
    left: Math.round(crop.left * width),
    top: Math.round(crop.top * height),
    width: Math.round(crop.width * width),
    height: Math.round(crop.height * height),
  }
}

async function buildPhoto({ slug, id, alt, tags, crop }) {
  const meta = await pexels(`/v1/photos/${id}`)
  const original = await cached(`${id}-full.jpg`, meta.src.original)
  const { autoOrient } = await sharp(original).metadata()
  const framed = sharp(original).autoOrient()
  if (crop) framed.extract(extract(crop, autoOrient.width, autoOrient.height))
  const resized = framed.resize({ width: MAX_WIDTH, withoutEnlargement: true })
  const graded = await (await gradePhoto(resized)).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
  const { width, height } = await sharp(graded).metadata()
  const key = hashed(slug, "jpg", graded)
  await upload(key, graded, "image/jpeg")
  console.log(slug, `${width}x${height}`, `${Math.round(graded.length / 1024)}KB`)
  return {
    kind: "image",
    slug,
    key,
    width,
    height,
    blurDataURL: await blurOf(graded),
    alt,
    tags,
    credit: { name: meta.photographer, url: meta.photographer_url },
    source: { provider: "pexels", id: String(id), pageUrl: meta.url },
  }
}

const ffmpeg = (args) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { stdio: "inherit" })

function sourceFile(meta) {
  const files = meta.video_files.filter((f) => f.file_type === "video/mp4" && f.width > f.height)
  const large = files.filter((f) => f.width >= MIN_SOURCE_WIDTH).sort((a, b) => a.width - b.width)
  return large[0] ?? files.sort((a, b) => b.width - a.width)[0]
}

const cropFilter = ({ left, top, width, height }) => `crop=iw*${width}:ih*${height}:iw*${left}:ih*${top}`

const cropFor = (shot, cut) => (cut.height > cut.width ? (shot.tallCrop ?? shot.crop) : shot.crop)

/** Scales to cover the wide cut. The tall cut takes a slice at the clip's focus first. */
function framing(shot, cut) {
  if (cut.height < cut.width) return []
  const crop = cropFor(shot, cut)
  const aspect = (shot.aspect * (crop?.width ?? 1)) / (crop?.height ?? 1)
  const width = cut.width / cut.height / aspect
  const left = Math.min(1 - width, Math.max(0, shot.focus - width / 2))
  return [cropFilter({ left, top: 0, width, height: 1 })]
}

/** Runs before scaling: takes the halos out of the detail, smooths blocky color and lowers the contrast. */
const SOFTEN = [
  "format=yuv444p",
  "gblur=sigma=4:planes=1",
  "gblur=sigma=18:planes=6",
  "eq=contrast=0.9:saturation=0.82",
]

/** A still in the film: a slow push-in, so it moves with the footage around it. */
function pushIn(shot, { width, height }) {
  const frames = Math.round(shot.length * 30)
  return [
    `scale=${2 * width}:${2 * height}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${2 * width}:${2 * height}`,
    `zoompan=z='1+0.05*on/${frames}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=${frames}:s=${width}x${height}:fps=30`,
  ]
}

/** Everything between a shot's source and the film, for one cut. */
const shotFilters = (shot, cut) => [
  ...(shot.photo ? [] : ["fps=30"]),
  ...(cropFor(shot, cut) ? [cropFilter(cropFor(shot, cut))] : []),
  ...(shot.soften ? SOFTEN : []),
  ...framing(shot, cut),
  ...(shot.photo ? pushIn(shot, cut) : [
    `scale=${cut.width}:${cut.height}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${cut.width}:${cut.height}`,
  ]),
  "setsar=1",
  `lut3d=file=${path.join(CACHE, "prood-grade.cube")}`,
]

const shotInput = (shot) => (shot.photo ? ["-i", shot.file] : ["-ss", String(shot.start), "-t", String(shot.length), "-i", shot.file])

/** Cut the curated clips into one graded, silent loop, wide and tall. */
async function buildFilm() {
  const shots = []
  for (const clip of curation.clips) {
    if (clip.photo) {
      const meta = await pexels(`/v1/photos/${clip.photo}`)
      shots.push({
        ...clip,
        aspect: meta.width / meta.height,
        file: await cached(`${clip.photo}-full.jpg`, meta.src.original),
        credit: { name: meta.photographer, url: meta.photographer_url },
        pageUrl: meta.url,
      })
      continue
    }
    const meta = await pexels(`/videos/videos/${clip.id}`)
    const file = sourceFile(meta)
    console.log("clip", clip.id, `${file.width}x${file.height}`)
    shots.push({
      ...clip,
      aspect: file.width / file.height,
      file: await cached(`${clip.id}-${file.width}.mp4`, file.link),
      credit: { name: meta.user.name, url: meta.user.url },
      pageUrl: meta.url,
    })
  }

  writeFileSync(path.join(CACHE, "prood-grade.cube"), gradeCube())

  const render = (cut, out) => {
    const { crf, maxrate } = cut
    const parts = shots.map((shot, i) => `[${i}:v]${shotFilters(shot, cut).join(",")}[v${i}]`).join(";")
    const joined = shots.map((_, i) => `[v${i}]`).join("")
    ffmpeg([
      ...shots.flatMap(shotInput),
      "-filter_complex",
      `${parts};${joined}concat=n=${shots.length}:v=1:a=0[out]`,
      "-map", "[out]", "-an",
      "-c:v", "libx264", "-preset", "slow", "-crf", String(crf),
      "-maxrate", maxrate, "-bufsize", `${parseInt(maxrate) * 2}k`,
      "-pix_fmt", "yuv420p", "-profile:v", "high", "-movflags", "+faststart",
      out,
    ])
  }

  const wide = path.join(CACHE, "hero-film-wide.mp4")
  const tall = path.join(CACHE, "hero-film-tall.mp4")
  const posterRaw = path.join(CACHE, "hero-film-poster.png")
  render(WIDE, wide)
  render(TALL, tall)
  // From the source, not the encoded film: compressing that frame twice is what posterizes it.
  const posterShot = shots.find((s) => s.posterAt !== undefined)
  const posterFrame = Math.round(posterShot.posterAt * 30)
  ffmpeg([
    ...shotInput(posterShot),
    "-vf", [...shotFilters(posterShot, WIDE), `select=eq(n\\,${posterFrame})`].join(","),
    "-frames:v", "1",
    posterRaw,
  ])
  const poster = await sharp(posterRaw).jpeg({ quality: 84, mozjpeg: true }).toBuffer()

  const wideKey = hashed("hero-film-wide", "mp4", readFileSync(wide))
  const tallKey = hashed("hero-film-tall", "mp4", readFileSync(tall))
  const posterKey = hashed("hero-film-poster", "jpg", poster)
  await upload(wideKey, readFileSync(wide), "video/mp4")
  await upload(tallKey, readFileSync(tall), "video/mp4")
  await upload(posterKey, poster, "image/jpeg")
  console.log("film", readFileSync(wide).length >> 10, "KB wide", readFileSync(tall).length >> 10, "KB tall")

  return {
    kind: "video",
    slug: "hero-film",
    key: wideKey,
    tallKey,
    posterKey,
    width: 1920,
    height: 1080,
    blurDataURL: await blurOf(poster),
    alt: "Short film of a shop's day: an old key in the lock, a chisel cuts at the bench, a florist finishes a bouquet, a woman comes in at the door, a parcel is wrapped and handed over at a door",
    tags: ["film", "people"],
    credits: shots.map((s) => ({ ...s.credit, pageUrl: s.pageUrl })),
  }
}

const previous = existsSync(LIBRARY) ? JSON.parse(readFileSync(LIBRARY, "utf8")) : []
const keep = (kind) => previous.filter((entry) => entry.kind === kind)
const images = target === "film" ? keep("image") : []
if (target !== "film") {
  for (const photo of curation.photos) images.push(await buildPhoto(photo))
}
const videos = target === "photos" ? keep("video") : [await buildFilm()]
writeFileSync(LIBRARY, `${JSON.stringify([...images, ...videos], null, 2)}\n`)
