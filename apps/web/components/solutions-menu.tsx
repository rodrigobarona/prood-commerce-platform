"use client"

import { CaretDownIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { solutionsNav } from "@/lib/site"

/**
 * The Solutions menu, as a disclosure: a button and a list of links in the
 * header's own order, so Tab moves on to the next header item when it leaves.
 */
export function SolutionsMenu() {
  const pathname = usePathname()
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const active = solutionsNav.some((item) => item.href === pathname)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setOpenOn(null)
      buttonRef.current?.focus()
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpenOn(null)
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenOn(null)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="solutions-menu"
        data-active={active || undefined}
        onClick={() => setOpenOn(open ? null : pathname)}
        className="group inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring aria-expanded:text-foreground data-active:text-foreground data-active:underline data-active:decoration-brand data-active:decoration-2 data-active:underline-offset-[6px]"
      >
        Solutions
        <CaretDownIcon aria-hidden className="size-3.5 transition-transform duration-150 group-aria-expanded:rotate-180" />
      </button>
      <ul
        id="solutions-menu"
        hidden={!open}
        className="absolute top-full left-0 z-50 mt-2 w-80 rounded-3xl bg-popover p-2 text-popover-foreground shadow-lg ring-1 ring-foreground/5 dark:ring-foreground/10"
      >
        {solutionsNav.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={item.href === pathname ? "page" : undefined}
              className="block rounded-2xl border-l-2 border-transparent px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:border-brand"
            >
              <span className="block text-sm font-medium text-foreground">{item.label}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
