"use client"

import { PauseIcon, PlayIcon } from "@phosphor-icons/react"
import { useCallback, useState, useSyncExternalStore } from "react"

const MOTION = "(prefers-reduced-motion: no-preference)"

function subscribeToMotion(onChange: () => void) {
  const query = window.matchMedia(MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

function usePlaysMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotion,
    () => window.matchMedia(MOTION).matches,
    () => false
  )
}

/**
 * The film and its pause control. Reduced motion renders neither, leaving the
 * poster. The control satisfies WCAG 2.2.2 for anything that moves past 5
 * seconds, and follows the element itself, so autoplay being blocked or starting
 * before hydration can't leave it showing the wrong state.
 */
export function FilmPlayer({
  wideUrl,
  tallUrl,
  videoClassName = "",
  controlClassName = "right-5 bottom-14 sm:right-8 sm:bottom-16",
}: {
  wideUrl: string
  tallUrl: string
  videoClassName?: string
  controlClassName?: string
}) {
  const plays = usePlaysMotion()
  const [video, setVideo] = useState<HTMLVideoElement | null>(null)
  const subscribe = useCallback(
    (onChange: () => void) => {
      video?.addEventListener("play", onChange)
      video?.addEventListener("pause", onChange)
      return () => {
        video?.removeEventListener("play", onChange)
        video?.removeEventListener("pause", onChange)
      }
    },
    [video]
  )
  const paused = useSyncExternalStore(
    subscribe,
    () => video?.paused ?? false,
    () => false
  )

  if (!plays) return null

  function toggle() {
    if (!video) return
    if (video.paused) void video.play()
    else video.pause()
  }

  return (
    <>
      <video
        ref={setVideo}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        tabIndex={-1}
        className={`absolute inset-0 size-full object-cover ${videoClassName}`}
      >
        <source src={tallUrl} type="video/mp4" media="(max-width: 767px)" />
        <source src={wideUrl} type="video/mp4" />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-label={paused ? "Play the film" : "Pause the film"}
        className={`absolute z-20 flex size-10 cursor-pointer items-center justify-center rounded-full border border-paper/50 bg-ink/30 text-paper backdrop-blur-sm transition-colors hover:bg-ink/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper ${controlClassName}`}
      >
        {paused ? <PlayIcon weight="fill" className="size-4" /> : <PauseIcon weight="fill" className="size-4" />}
      </button>
    </>
  )
}
