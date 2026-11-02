import Image from "next/image"

import { getVideo } from "./index"
import { FilmPlayer } from "./film-player"

/**
 * Silent looping film over its poster. The poster is the page's LCP, so the
 * first paint never waits for video. Resolves the film here, on the server, so
 * the media library stays out of the client bundle.
 */
export function MediaVideo({
  slug,
  className,
  posterClassName,
  videoClassName,
  controlClassName,
}: {
  slug: string
  className?: string
  /** Framing of the poster, a wide frame even on a phone. */
  posterClassName?: string
  /** Framing of the film. */
  videoClassName?: string
  /** Where the pause control sits. */
  controlClassName?: string
}) {
  const video = getVideo(slug)
  return (
    <div className={className}>
      <Image
        src={video.poster}
        alt={video.alt}
        fill
        preload
        sizes="(min-aspect-ratio: 16/9) 100vw, 178vh"
        placeholder="blur"
        blurDataURL={video.blurDataURL}
        className={posterClassName ?? "object-cover object-[84%_50%] md:object-center"}
      />
      <FilmPlayer
        wideUrl={video.url}
        tallUrl={video.tallUrl}
        videoClassName={videoClassName}
        controlClassName={controlClassName}
      />
    </div>
  )
}
