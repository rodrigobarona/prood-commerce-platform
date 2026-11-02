"use client"

import Link from "next/link"
import { LogoMark } from "@prood/ui/components/logo"
import { SidebarTrigger, useSidebar } from "@prood/ui/components/sidebar"
import { cn } from "@prood/ui/lib/utils"
import { AdminMarker } from "@/components/admin/admin-marker"

/**
 * Tools, not titles: every page names itself with `PageHeader`. The mark and
 * the Admin marker stand in for the sidebar when it's a sheet or collapsed.
 */
export function AdminHeader() {
  const { state } = useSidebar()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Link href="/" aria-label="Go to overview" className="-m-2 p-2 md:hidden">
          <LogoMark className="size-6" title={null} />
        </Link>
      </div>
      <span className={cn("md:hidden", state === "collapsed" && "md:inline")}>
        <AdminMarker />
      </span>
    </header>
  )
}
