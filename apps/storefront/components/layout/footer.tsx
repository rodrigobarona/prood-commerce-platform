import Link from "next/link"
import { cacheLife } from "next/cache"
import { localized } from "@prood/ui/lib/commerce"
import { fetchStoreInfo } from "@/lib/commerce-data"

const STORE_LINKS = [
  { href: "/products", label: "All products" },
  { href: "/cart", label: "Cart" },
  { href: "/account/orders", label: "Orders" },
]

const SUPPORT = [
  { href: "/account", label: "My account" },
  { href: "/login", label: "Sign in" },
]

async function CopyrightYear() {
  "use cache"
  cacheLife("max")
  return new Date().getFullYear()
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

  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-3">
        <div className="flex flex-col gap-2">
          {name ? <span className="text-base font-bold">{name}</span> : null}
          {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
          {store?.contactEmail ? (
            <a
              href={`mailto:${store.contactEmail}`}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {store.contactEmail}
            </a>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Store</span>
          {STORE_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground text-sm">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Support</span>
          {SUPPORT.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted-foreground hover:text-foreground text-sm">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      {name ? (
        <div className="text-muted-foreground border-t py-6 text-center text-xs">
          © {year} {name}. All rights reserved.
        </div>
      ) : null}
    </footer>
  )
}
