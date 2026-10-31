import Link from "next/link"

import { Button } from "@prood/ui/components/button"
import { Logo } from "@prood/ui/components/logo"
import { MobileNav } from "@/components/mobile-nav"
import { NavLink } from "@/components/nav-link"
import { mainNav, siteConfig } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5 sm:px-6">
        <Link href="/" aria-label="Prood home" className="rounded-md">
          <Logo title={null} className="h-7" />
        </Link>

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {mainNav.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
            <li>
              <a
                href={siteConfig.docsUrl}
                className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Docs
              </a>
            </li>
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="lg" className="hidden sm:inline-flex" asChild>
            <a href={siteConfig.loginUrl}>Sign in</a>
          </Button>
          <Button variant="brand" size="lg" asChild>
            <a href={siteConfig.registerUrl}>Start free</a>
          </Button>
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
