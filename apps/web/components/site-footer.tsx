import Link from "next/link"

import { Wordmark } from "@prood/ui/components/logo"
import { TileEdge } from "@prood/ui/components/tile"
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
      { label: "Design system", href: "/design" },
      { label: "Photo credits", href: "/credits" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Data processing", href: "/dpa" },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer className="relative">
      <TileEdge className="absolute inset-x-0 top-0 z-10 text-(--footer-edge,var(--background))" />
      <div className="surface-ink">
        <div className="mx-auto max-w-[84rem] px-5 pt-24 pb-10 sm:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <p className="max-w-xs text-lead">
              Hosted commerce for Europe, on your own domain and payment accounts. Priced in euros. Hosted in Frankfurt.
            </p>
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="font-sans text-sm font-semibold">{column.title}</h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith("/") ? (
                        <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <Wordmark title={null} className="mt-20 h-auto w-full text-paper" />

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 Prood. Operated by {siteConfig.legal.name}</p>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}
