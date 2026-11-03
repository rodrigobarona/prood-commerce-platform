"use client"

import { ListIcon, XIcon } from "@phosphor-icons/react"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Button } from "@prood/ui/components/button"
import { NavLink } from "@/components/nav-link"
import { mainNav, siteConfig, solutionsNav, type NavItem } from "@/lib/site"

function link(item: NavItem) {
  return (
    <li key={item.href}>
      <NavLink href={item.href} className="block px-0 py-3 text-base">
        {item.label}
      </NavLink>
    </li>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      setOpenOn(null)
      toggleRef.current?.focus()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <div className="lg:hidden">
      <Button
        ref={toggleRef}
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpenOn(open ? null : pathname)}
      >
        {open ? <XIcon className="size-5" /> : <ListIcon className="size-5" />}
      </Button>

      <nav
        id="mobile-nav"
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-background px-5 pt-2 pb-6 shadow-sm"
      >
        <ul className="flex flex-col">
          {mainNav.before.map(link)}
          <li className="py-3">
            <p id="mobile-solutions" className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Solutions
            </p>
            <ul aria-labelledby="mobile-solutions" className="mt-1 flex flex-col">
              {solutionsNav.map(link)}
            </ul>
          </li>
          {mainNav.after.map(link)}
          <li>
            <a href={siteConfig.docsUrl} className="block py-3 text-base text-muted-foreground">
              Docs
            </a>
          </li>
          <li>
            <a href={siteConfig.loginUrl} className="block py-3 text-base text-muted-foreground">
              Sign in
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}
