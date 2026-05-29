import Link from "next/link"
import { cacheLife } from "next/cache"

const SHOP = [
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
  const year = await CopyrightYear()

  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <span className="text-base font-bold">Commerce</span>
          <p className="text-muted-foreground text-sm">
            A commerce-agnostic storefront built with Next.js.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Shop</span>
          {SHOP.map((l) => (
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
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Newsletter</span>
          <p className="text-muted-foreground text-sm">
            Subscribe for product updates and offers.
          </p>
        </div>
      </div>
      <div className="text-muted-foreground border-t py-6 text-center text-xs">
        © {year} Commerce. All rights reserved.
      </div>
    </footer>
  )
}
