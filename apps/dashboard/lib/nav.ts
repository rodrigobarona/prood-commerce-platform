import type { Icon } from "@phosphor-icons/react"
import {
  ChartLineUp,
  Gauge,
  Gear,
  Globe,
  Package,
  PuzzlePiece,
  Receipt,
  ShoppingBag,
  Storefront,
  User,
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

/** Sidebar navigation, grouped by concern. */
export const navGroups: NavGroup[] = [
  {
    label: "Store",
    items: [
      { title: "Overview", href: "/", icon: Gauge },
      { title: "Products", href: "/products", icon: Package },
      { title: "Orders", href: "/orders", icon: ShoppingBag },
      { title: "Customers", href: "/customers", icon: Users },
      { title: "Analytics", href: "/analytics", icon: ChartLineUp },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Domains", href: "/domains", icon: Globe },
      { title: "Team", href: "/team", icon: UsersThree },
      { title: "Integrations", href: "/integrations", icon: PuzzlePiece },
    ],
  },
  {
    label: "Account",
    items: [
      { title: "Profile", href: "/account", icon: User },
      { title: "Store settings", href: "/settings", icon: Gear },
      { title: "Billing", href: "/billing", icon: Receipt },
    ],
  },
]

export const storeIcon = Storefront
