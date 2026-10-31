import Link from "next/link"

import { Logo } from "@prood/ui/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { docsPage, siteConfig } from "@/lib/site"

const columns = [
  {
    title: "Product",
    links: [
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "For agencies", href: "/agencies" },
      { label: "For developers", href: "/developers" },
    ],
  },
  {
    title: "Docs",
    links: [
      { label: "Quick start", href: docsPage("getting-started/quick-start") },
      { label: "Merchant guide", href: docsPage("guides/for-merchants") },
      { label: "API reference", href: siteConfig.apiReferenceUrl },
      { label: "MCP server", href: docsPage("apps/api/mcp") },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: `mailto:${siteConfig.email}` },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo className="h-7" />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Commerce on your own domain, your own payment accounts and an open API. No cut of
              your sales.
            </p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="font-sans text-sm font-semibold">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.href.startsWith("/") ? (
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
          <p>© 2026 Prood</p>
          <ThemeToggle />
        </div>
      </div>
    </footer>
  )
}
