import { MEDIA_URL } from "../remote-pattern.mjs"

import library from "./library.json"
import type { MediaEntry, MediaImage, MediaImageEntry, MediaVideo, MediaVideoEntry } from "./types"

export type { MediaCredit, MediaEntry, MediaImage, MediaVideo } from "./types"

/**
 * `sizes` for a landscape photo filling a full-bleed hero. On a tall viewport the
 * height decides, and the photo is cropped to it, so `100vw` would pick a source
 * too small to stay sharp.
 */
export const FULL_BLEED_SIZES = "(min-aspect-ratio: 5/4) 100vw, 120vh"

const ENTRIES = library as MediaEntry[]
const BY_SLUG = new Map(ENTRIES.map((entry) => [entry.slug, entry]))

function url(key: string): string {
  return `${MEDIA_URL}/${key}`
}

function resolveImage(entry: MediaImageEntry): MediaImage {
  return { ...entry, url: url(entry.key) }
}

function resolveVideo(entry: MediaVideoEntry): MediaVideo {
  return { ...entry, url: url(entry.key), tallUrl: url(entry.tallKey), poster: url(entry.posterKey) }
}

export function getImage(slug: string): MediaImage {
  const entry = BY_SLUG.get(slug)
  if (entry?.kind !== "image") throw new Error(`@prood/media: no image "${slug}" in library.json`)
  return resolveImage(entry)
}

export function getVideo(slug: string): MediaVideo {
  const entry = BY_SLUG.get(slug)
  if (entry?.kind !== "video") throw new Error(`@prood/media: no video "${slug}" in library.json`)
  return resolveVideo(entry)
}

/**
 * Pexels names are free text: runs of spaces, a business after a pipe, a bare URL
 * or a single letter. Keep the person's name, and read it off their profile
 * address when the field doesn't hold one.
 */
function displayName(name: string, profile: string): string {
  const clean = name.split("|")[0]?.replace(/\s+/g, " ").trim() ?? ""
  if (clean.length > 1 && !/^(https?:|www\.)/i.test(clean)) return clean
  const handle = profile.split("/@")[1]?.replace(/-\d+$/, "") ?? ""
  const words = handle.split("-").filter(Boolean)
  return words.length > 0
    ? words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "Pexels contributor"
}

/** Photo and film credits, one row per person, for the public credits page. */
export function mediaCredits(): { name: string; url: string; count: number }[] {
  const people = new Map<string, { name: string; url: string; count: number }>()
  const add = (name: string, link: string) => {
    const person = people.get(link) ?? { name: displayName(name, link), url: link, count: 0 }
    people.set(link, { ...person, count: person.count + 1 })
  }
  for (const entry of ENTRIES) {
    if (entry.kind === "image") add(entry.credit.name, entry.credit.url)
    else entry.credits.forEach((credit) => add(credit.name, credit.url))
  }
  return [...people.values()].sort((a, b) => a.name.localeCompare(b.name))
}
