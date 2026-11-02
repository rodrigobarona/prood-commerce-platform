"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LogoMark, Wordmark } from "@prood/ui/components/logo"
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
  useSidebar,
} from "@prood/ui/components/sidebar"
import { isActive, navGroups } from "@/lib/nav"
import { OrgSwitcher, type OrgSummary } from "@/components/layout/org-switcher"
import { DashboardUserMenu } from "@/components/layout/user-menu"
import type { UserSummary } from "@prood/ui/components/user-menu"

/** Telha marks where you are. The kit's menu button is neutral, so the active colors are set here. */
const NAV_BUTTON =
  "rounded-lg data-[active=true]:bg-brand-subtle data-[active=true]:text-brand-subtle-foreground data-[active=true]:hover:bg-brand-subtle data-[active=true]:hover:text-brand-subtle-foreground"

export function SidebarBrand() {
  return (
    <Link
      href="/"
      aria-label="Prood, go to overview"
      className="flex h-8 items-center gap-2 rounded-lg px-1 outline-hidden focus-visible:ring-2 focus-visible:ring-sidebar-ring group-data-[collapsible=icon]:px-0"
    >
      <LogoMark className="size-6" title={null} />
      <Wordmark className="h-3.5 group-data-[collapsible=icon]:hidden" title={null} />
    </Link>
  )
}

export function DashboardSidebar({
  orgs,
  activeOrgId,
  user,
}: {
  orgs: OrgSummary[]
  activeOrgId: string | null
  user: UserSummary
}) {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 p-3">
        <SidebarBrand />
        <OrgSwitcher orgs={orgs} activeOrgId={activeOrgId} />
      </SidebarHeader>
      <SidebarContent>
        <nav aria-label="Main">
          {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="px-3 py-2">
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(pathname, item.href)}
                    tooltip={item.title}
                    className={NAV_BUTTON}
                  >
                    <Link href={item.href} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          ))}
        </nav>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <DashboardUserMenu user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
