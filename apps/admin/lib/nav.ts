import type { Icon } from "@phosphor-icons/react"
import {
  ChartLineUp,
  Gauge,
  Gear,
  Globe,
  Key,
  Robot,
  ShieldCheck,
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

export const navGroups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: Gauge },
    ],
  },
  {
    label: "Identity",
    items: [
      { title: "Users", href: "/users", icon: Users },
      { title: "Organizations", href: "/organizations", icon: UsersThree },
      { title: "Sessions", href: "/sessions", icon: ChartLineUp },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Domains", href: "/domains", icon: Globe },
      { title: "API Keys", href: "/api-keys", icon: Key },
      { title: "Agents", href: "/agents", icon: Robot },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Gear },
    ],
  },
]

export const adminIcon = ShieldCheck
