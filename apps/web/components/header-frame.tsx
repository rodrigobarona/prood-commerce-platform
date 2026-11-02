"use client"

import { usePathname } from "next/navigation"
import { useSyncExternalStore, type ReactNode } from "react"

import { cn } from "@prood/ui/lib/utils"
import { overlayRoutes } from "@/lib/site"

function subscribe(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true })
  return () => window.removeEventListener("scroll", onChange)
}

/** Starts transparent over a full-bleed hero, on its own scrim, and turns solid once you scroll. */
export function HeaderFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const scrolled = useSyncExternalStore(
    subscribe,
    () => window.scrollY > 48,
    () => false
  )
  const overlay = overlayRoutes.includes(pathname) && !scrolled

  return (
    <header
      data-overlay={overlay || undefined}
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color] duration-200 ease-standard",
        overlay
          ? "surface-ink surface-photo border-transparent bg-transparent! before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-32 before:bg-linear-to-b before:from-ink/70 before:to-transparent"
          : "border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75"
      )}
    >
      {children}
    </header>
  )
}
