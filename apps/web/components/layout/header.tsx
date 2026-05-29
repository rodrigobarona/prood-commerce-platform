import Link from "next/link"
import { UserIcon } from "@phosphor-icons/react/dist/ssr"
import type { Category } from "@workspace/commerce/types"
import { getCategories, getStoreInfo } from "@workspace/commerce"
import { Button } from "@workspace/ui/components/button"
import { localized } from "@workspace/ui/lib/commerce"
import { CartButton } from "@/components/layout/cart-button"
import { MobileMenu, type NavLink } from "@/components/layout/mobile-menu"
import { Search } from "@/components/layout/search"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export async function Header() {
  let categories: Category[] = []
  let storeName = "Commerce"

  try {
    categories = await getCategories()
  } catch {
    // DB unavailable (e.g. during build without DATABASE_URL) — render shell only.
  }
  try {
    const store = await getStoreInfo()
    if (store) storeName = localized(store.name) || storeName
  } catch {
    // ignore — fall back to default name
  }

  const navLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    ...categories.slice(0, 5).map((c) => ({
      href: `/categories/${c.slug}`,
      label: localized(c.name),
    })),
  ]

  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <MobileMenu links={navLinks} />
        <Link href="/" className="text-lg font-bold tracking-tight">
          {storeName}
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
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
        <div className="ml-auto flex items-center gap-1">
          <Search />
          <Button asChild variant="ghost" size="icon" aria-label="Account">
            <Link href="/account">
              <UserIcon />
            </Link>
          </Button>
          <ThemeToggle />
          <CartButton />
        </div>
      </div>
    </header>
  )
}
