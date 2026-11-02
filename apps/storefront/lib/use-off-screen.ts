"use client"

import { useEffect, useState } from "react"

/**
 * Stretches the viewport far below the fold, so the only edge left to cross is
 * its top. A fast scroll can jump from below the viewport to above it between
 * two frames, and a plain observer hears nothing: out of view both times.
 */
const ONLY_THE_TOP_EDGE = "0px 0px 1000000px 0px"

/**
 * Attach the returned ref to something, and hear whether it's out of the viewport.
 * `passed` means it has scrolled up past the top, so something the shopper hasn't
 * reached yet doesn't count. `either` counts that too.
 */
export function useOffScreen<T extends Element>(side: "passed" | "either") {
  const [element, setElement] = useState<T | null>(null)
  const [offScreen, setOffScreen] = useState(false)

  useEffect(() => {
    if (!element || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setOffScreen(!entry.isIntersecting && (side === "either" || entry.boundingClientRect.bottom < 0))
      },
      side === "passed" ? { rootMargin: ONLY_THE_TOP_EDGE } : undefined,
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [element, side])

  return [setElement, offScreen] as const
}
