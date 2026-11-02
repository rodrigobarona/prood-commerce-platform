"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CaretUpDown, Check, Gear, Plus } from "@phosphor-icons/react"
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
import { cn } from "@prood/ui/lib/utils"
import { authClient } from "@/lib/auth/client"

export interface OrgSummary {
  id: string
  name: string
  slug: string
  logo?: string | null
}

/** The store's own initial, kept quiet: the only Telha tile in the sidebar is Prood's. */
function StoreTile({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg border border-sidebar-border bg-background font-heading text-sm font-medium",
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
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
    try {
      await authClient.organization.setActive({ organizationId: orgId })
      router.refresh()
    } catch {
      toast.error("We couldn't switch stores. The request didn't finish. Try again.")
    } finally {
      setSwitching(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={switching}
              className="rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <StoreTile name={active?.name ?? ""} />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {active?.name ?? "Select a store"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {active?.slug ?? ""}
                </span>
                <span className="sr-only">, switch store</span>
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
              Your stores
            </DropdownMenuLabel>
            {orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelect(org.id)}
                className="gap-2"
              >
                <StoreTile name={org.name} className="size-5 rounded-sm text-xs" />
                <span className="truncate">{org.name}</span>
                {org.id === active?.id ? (
                  <Check className="ml-auto size-4" />
                ) : null}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/new-store">
                <Plus className="size-4" />
                <span>Add store</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Gear className="size-4" />
                <span>Store settings</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
