import type { Icon } from "@phosphor-icons/react"
import {
  Devices,
  Gauge,
  Gear,
  Globe,
  Key,
  Robot,
  Storefront,
  Users,
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

export const navGroups: NavGroup[] = [
  {
    label: "Platform",
    items: [
      { title: "Overview", href: "/", icon: Gauge },
      { title: "Organizations", href: "/organizations", icon: Storefront },
      { title: "Domains", href: "/domains", icon: Globe },
    ],
  },
  {
    label: "Access",
    items: [
      { title: "Users", href: "/users", icon: Users },
      { title: "Sessions", href: "/sessions", icon: Devices },
      { title: "API keys", href: "/api-keys", icon: Key },
      { title: "AI agents", href: "/agents", icon: Robot },
    ],
  },
  {
    label: "System",
    items: [{ title: "Settings", href: "/settings", icon: Gear }],
  },
]

export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}
