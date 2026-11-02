"use client"

import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react"
import { useCallback, useSyncExternalStore } from "react"

import { Button } from "@prood/ui/components/button"
import { cn } from "@prood/ui/lib/utils"

type Position = "start" | "middle" | "end"

/** Previous and next for a sideways list on a screen with no swipe: one door at a time. */
export function StreetControls({ targetId, className }: { targetId: string; className?: string }) {
  const position = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        const street = document.getElementById(targetId)
        street?.addEventListener("scroll", onChange, { passive: true })
        window.addEventListener("resize", onChange)
        return () => {
          street?.removeEventListener("scroll", onChange)
          window.removeEventListener("resize", onChange)
        }
      },
      [targetId]
    ),
    (): Position => {
      const street = document.getElementById(targetId)
      if (!street || street.scrollLeft <= 1) return "start"
      return street.scrollLeft + street.clientWidth >= street.scrollWidth - 1 ? "end" : "middle"
    },
    (): Position => "start"
  )

  /** The list's own scroll-behavior applies, so reduced motion jumps instead of gliding. */
  const move = (direction: 1 | -1) => {
    const street = document.getElementById(targetId)
    const door = street?.firstElementChild
    if (street && door instanceof HTMLElement) street.scrollBy({ left: direction * door.offsetWidth })
  }

  return (
    <div className={cn("gap-2", className)}>
      <Button
        variant="on-photo"
        size="icon-lg"
        aria-label="Previous stores"
        aria-controls={targetId}
        disabled={position === "start"}
        onClick={() => move(-1)}
      >
        <CaretLeftIcon aria-hidden />
      </Button>
      <Button
        variant="on-photo"
        size="icon-lg"
        aria-label="Next stores"
        aria-controls={targetId}
        disabled={position === "end"}
        onClick={() => move(1)}
      >
        <CaretRightIcon aria-hidden />
      </Button>
    </div>
  )
}
