import type { ReactNode } from "react"
import Link from "next/link"
import { LogoMark } from "@prood/ui/components/logo"
import { SidebarTrigger } from "@prood/ui/components/sidebar"

/**
 * Tools, not titles: every page names itself with `PageHeader`. The mark stands
 * in for the sidebar on phones, where the sidebar is a sheet.
 */
export function DashboardHeader({ storeLink }: { storeLink?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Link href="/" aria-label="Go to overview" className="-m-2 p-2 md:hidden">
          <LogoMark className="size-6" title={null} />
        </Link>
      </div>
      {storeLink}
    </header>
  )
}
