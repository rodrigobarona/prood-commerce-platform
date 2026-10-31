"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@prood/ui/components/sidebar"
import { navGroups } from "@/lib/nav"
import { OrgSwitcher, type OrgSummary } from "@/components/layout/org-switcher"
import { UserMenu, type UserSummary } from "@/components/layout/user-menu"

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardSidebar({
  orgs,
  activeOrgId,
  storeLink,
  user,
}: {
  orgs: OrgSummary[]
  activeOrgId: string | null
  storeLink: ReactNode
  user: UserSummary
}) {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
        {storeLink}
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <UserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
