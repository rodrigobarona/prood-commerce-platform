import Link from "next/link"
import { cacheLife } from "next/cache"
import { localized, paymentNote } from "@prood/ui/lib/commerce"
import { Suspense } from "react"
import { Container } from "@/components/layout/container"
import { PolicyLinks } from "@/components/layout/policy-links"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { fetchStoreInfo } from "@/lib/commerce-data"

const STORE_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/cart", label: "Cart" },
  { href: "/account/orders", label: "Orders" },
]

const SUPPORT = [
  { href: "/account", label: "Your account" },
  { href: "/login", label: "Sign in" },
]

async function CopyrightYear() {
  "use cache"
  cacheLife("max")
  return new Date().getFullYear()
}

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <h2 className="font-sans text-sm font-medium">{title}</h2>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  )
}

export async function Footer() {
  const [year, store] = await Promise.all([
    CopyrightYear(),
    // The footer sits outside error.tsx, so it renders without the store's
    // details rather than taking the page down.
    fetchStoreInfo().catch(() => null),
  ])
  const name = store ? localized(store.name) : null
  const description = store?.description ? localized(store.description) : null
  const payment = store ? paymentNote(store.paymentMethods) : null

  return (
    <footer className="mt-auto border-t">
      <Container className="grid gap-10 py-12 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)] md:py-16">
        <div className="flex max-w-sm flex-col gap-2">
          {name ? <span className="font-heading text-xl tracking-tight">{name}</span> : null}
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          {store?.contactEmail ? (
            <a
              href={`mailto:${store.contactEmail}`}
              className="text-muted-foreground hover:text-foreground w-fit text-sm underline underline-offset-4"
            >
              {store.contactEmail}
            </a>
          ) : null}
          {payment ? <p className="text-muted-foreground text-sm">{payment}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-8 md:contents">
          <LinkColumn title="Store" links={STORE_LINKS} />
          <LinkColumn title="Support" links={SUPPORT} />
        </div>
      </Container>
      <div className="border-t">
        <Container className="text-muted-foreground flex items-center justify-between gap-4 py-3 text-xs">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {name ? (
              <span>
                © {year} {name}. All rights reserved.
              </span>
            ) : null}
            <a href="https://prood.com" className="hover:text-foreground inline-flex min-h-6 items-center transition-colors">
              Powered by Prood
            </a>
            <Suspense fallback={null}>
              <PolicyLinks />
            </Suspense>
          </div>
          <ThemeToggle />
        </Container>
      </div>
    </footer>
  )
}
