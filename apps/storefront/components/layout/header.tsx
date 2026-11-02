import Image from "next/image"
import Link from "next/link"
import { UserIcon } from "@phosphor-icons/react/dist/ssr"
import type { Category, StorefrontStore } from "@prood/types"
import { fetchCategories, fetchStoreInfo } from "@/lib/commerce-data"
import { Button } from "@prood/ui/components/button"
import { localized } from "@prood/ui/lib/commerce"
import { CartButton } from "@/components/layout/cart-button"
import { Container } from "@/components/layout/container"
import { MobileMenu, type NavLink } from "@/components/layout/mobile-menu"
import { Search } from "@/components/layout/search"

export async function Header() {
  let categories: Category[] = []
  let store: StorefrontStore | null = null

  try {
    categories = await fetchCategories()
  } catch {
    // DB unavailable (e.g. during build without DATABASE_URL) — render shell only.
  }
  try {
    store = await fetchStoreInfo()
  } catch {
    // Header renders without the name rather than taking the page down.
  }

  const storeName = store ? localized(store.name) : ""
  const navLinks: NavLink[] = [
    { href: "/products", label: "All products" },
    ...categories.slice(0, 4).map((c) => ({
      href: `/categories/${c.slug}`,
      label: localized(c.name),
    })),
  ]

  return (
    <header className="bg-background/95 sticky top-0 z-40 border-b backdrop-blur-sm">
      <Container className="grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="flex items-center gap-6">
          <MobileMenu links={navLinks} storeName={storeName} />
          <nav aria-label="Main" className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <Link href="/" className="font-heading truncate text-xl tracking-tight md:text-2xl">
          {store?.logo ? (
            <Image
              src={store.logo.url}
              alt={store.logo.alt || storeName}
              width={160}
              height={40}
              className="h-8 w-auto object-contain"
            />
          ) : (
            storeName
          )}
        </Link>

        {/* Pulled out by the buttons' padding, so the icons sit on the page's edge. */}
        <div className="-mr-2.5 flex items-center justify-end">
          <Search />
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Your account"
            className="hidden size-10 sm:inline-flex [&_svg:not([class*='size-'])]:size-5"
          >
            <Link href="/account">
              <UserIcon />
            </Link>
          </Button>
          <CartButton />
        </div>
      </Container>
    </header>
  )
}
