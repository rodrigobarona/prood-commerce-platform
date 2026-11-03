"use client"

import { CaretDownIcon } from "@phosphor-icons/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@prood/ui/components/popover"
import { solutionsNav } from "@/lib/site"

/** The Solutions menu: a disclosure of links, so it reads as navigation, not a command menu. */
export function SolutionsMenu() {
  const pathname = usePathname()
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const active = solutionsNav.some((item) => item.href === pathname)

  return (
    <Popover open={open} onOpenChange={(next) => setOpenOn(next ? pathname : null)}>
      <PopoverTrigger
        data-active={active || undefined}
        className="group inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-active:text-foreground data-[state=open]:text-foreground"
      >
        Solutions
        <CaretDownIcon
          aria-hidden
          className="size-3.5 transition-transform duration-150 group-data-[state=open]:rotate-180"
        />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-80 gap-0 p-2">
        <ul>
          {solutionsNav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={item.href === pathname ? "page" : undefined}
                onClick={() => setOpenOn(null)}
                className="block rounded-2xl px-3 py-2.5 outline-none transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-[current=page]:bg-muted"
              >
                <span className="block text-sm font-medium text-foreground">{item.label}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{item.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}
