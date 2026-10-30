"use client"

import { ListIcon, XIcon } from "@phosphor-icons/react"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { Button } from "@prood/ui/components/button"
import { NavLink } from "@/components/nav-link"
import { mainNav, siteConfig } from "@/lib/site"

export function MobileNav() {
  const pathname = usePathname()
  // The menu belongs to the page it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenOn(null)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [open])

  return (
    <div className="md:hidden">
      <Button
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
        className="absolute inset-x-0 top-16 border-b border-border bg-background px-5 pt-2 pb-6 shadow-sm"
      >
        <ul className="flex flex-col">
          {mainNav.map((item) => (
            <li key={item.href}>
              <NavLink href={item.href} className="block px-0 py-3 text-base">
                {item.label}
              </NavLink>
            </li>
          ))}
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
