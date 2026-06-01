"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { CaretUpDown, Check, Gear, Storefront } from "@phosphor-icons/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@prood/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@prood/ui/components/sidebar"
import { authClient } from "@/lib/auth/client"

export interface OrgSummary {
  id: string
  name: string
  slug: string
  logo?: string | null
}

export function OrgSwitcher({
  orgs,
  activeOrgId,
}: {
  orgs: OrgSummary[]
  activeOrgId: string | null
}) {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const [switching, setSwitching] = useState(false)

  const active = orgs.find((org) => org.id === activeOrgId) ?? orgs[0]

  async function handleSelect(orgId: string) {
    if (orgId === active?.id) return
    setSwitching(true)
    await authClient.organization.setActive({ organizationId: orgId })
    setSwitching(false)
    router.refresh()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={switching}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground">
                <Storefront className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {active?.name ?? "Select a store"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {active?.slug ?? ""}
                </span>
              </div>
              <CaretUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Stores
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="gap-2"
              >
                <Storefront className="size-4 shrink-0" />
                <span className="truncate">{org.name}</span>
                {org.id === active?.id ? (
                  <Check className="ml-auto size-4" />
                ) : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Gear className="size-4" />
              <span>Store settings</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
