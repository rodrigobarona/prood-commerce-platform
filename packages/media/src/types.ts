export interface MediaCredit {
  name: string
  url: string
}

interface MediaFields {
  slug: string
  width: number
  height: number
  blurDataURL: string
  alt: string
  tags: string[]
}

/** `library.json` stores object keys; the host is `MEDIA_URL` in `remote-pattern.mjs`. */
export interface MediaImageEntry extends MediaFields {
  kind: "image"
  key: string
  credit: MediaCredit
  source: { provider: "pexels"; id: string; pageUrl: string }
}

export interface MediaVideoEntry extends MediaFields {
  kind: "video"
  /** Wide H.264 cut for tablets and up. */
  key: string
  /** Portrait H.264 cut for phones. */
  tallKey: string
  posterKey: string
  credits: (MediaCredit & { pageUrl: string })[]
}

export type MediaEntry = MediaImageEntry | MediaVideoEntry

export interface MediaImage extends MediaImageEntry {
  url: string
}

export interface MediaVideo extends MediaVideoEntry {
  url: string
  tallUrl: string
  poster: string
}
