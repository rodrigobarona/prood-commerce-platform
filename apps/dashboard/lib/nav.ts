import type { Icon } from "@phosphor-icons/react"
import {
  Gauge,
  Gear,
  Globe,
  Key,
  Package,
  PuzzlePiece,
  Receipt,
  ShoppingBag,
  Users,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr"

export interface NavItem {
  title: string
  href: string
  icon: Icon
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

/** Sidebar navigation. A merchant's day first, then what connects the store, then the organization. */
export const navGroups: NavGroup[] = [
  {
    label: "Store",
    items: [
      { title: "Overview", href: "/", icon: Gauge },
      { title: "Orders", href: "/orders", icon: ShoppingBag },
      { title: "Products", href: "/products", icon: Package },
      { title: "Customers", href: "/customers", icon: Users },
    ],
  },
  {
    label: "Connections",
    items: [
      { title: "Domains", href: "/domains", icon: Globe },
      { title: "Integrations", href: "/integrations", icon: PuzzlePiece },
      { title: "API keys", href: "/settings/api-keys", icon: Key },
    ],
  },
  {
    label: "Organization",
    items: [
      { title: "Team", href: "/team", icon: UsersThree },
      { title: "Store settings", href: "/settings", icon: Gear },
      { title: "Billing", href: "/billing", icon: Receipt },
    ],
  },
]

/** One item lights up at a time, so a nested item beats its parent: API keys, not Store settings. */
export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  if (pathname !== href && !pathname.startsWith(`${href}/`)) return false
  const nested = navGroups
    .flatMap((group) => group.items)
    .some((item) => item.href.startsWith(`${href}/`) && pathname.startsWith(item.href))
  return !nested
}
