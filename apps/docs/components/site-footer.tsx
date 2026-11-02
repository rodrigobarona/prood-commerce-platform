import Link from 'next/link';
import { Wordmark } from '@prood/ui/components/logo';
import { TileEdge } from '@prood/ui/components/tile';
import { ThemeSwitch } from 'fumadocs-ui/layouts/shared/slots/theme-switch';
import { site } from '@/lib/site';

const columns = [
  {
    title: 'Docs',
    links: [
      { label: 'Quick start', href: '/docs/getting-started/quick-start' },
      { label: 'Merchant guide', href: '/docs/guides/for-merchants' },
      { label: 'API reference', href: '/docs/api' },
      { label: 'MCP server', href: '/docs/apps/api/mcp' },
    ],
  },
  {
    title: 'Product',
    links: [
      { label: 'Pricing', href: `${site.marketingUrl}/pricing` },
      { label: 'Integrations', href: `${site.marketingUrl}/integrations` },
      { label: 'For agencies', href: `${site.marketingUrl}/agencies` },
      { label: 'For developers', href: `${site.marketingUrl}/developers` },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', href: `mailto:${site.email}` },
      { label: 'Design system', href: `${site.marketingUrl}/design` },
      { label: 'Photo credits', href: `${site.marketingUrl}/credits` },
      { label: 'Privacy', href: `${site.marketingUrl}/privacy` },
      { label: 'Terms', href: `${site.marketingUrl}/terms` },
    ],
  },
] as const;

const linkClass = 'text-sm text-muted-foreground transition-colors hover:text-foreground';

export function SiteFooter() {
  return (
    <footer className="relative">
      <TileEdge className="absolute inset-x-0 top-0 z-10 text-background" />
      <div className="surface-ink">
        <div className="mx-auto max-w-[84rem] px-5 pt-24 pb-10 sm:px-8 lg:px-12">
          <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            <p className="max-w-xs text-lead">
              Commerce on your own domain, your own payment accounts and an open API. No cut of your
              sales.
            </p>
            {columns.map((column) => (
              <nav key={column.title} aria-label={column.title}>
                <h2 className="font-sans text-sm font-semibold">{column.title}</h2>
                <ul className="mt-4 space-y-3">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      {link.href.startsWith('/') ? (
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      ) : (
                        <a href={link.href} className={linkClass}>
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
            <p>© 2026 Prood</p>
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </footer>
  );
}
