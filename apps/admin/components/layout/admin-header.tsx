"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@prood/ui/components/separator"
import { SidebarTrigger } from "@prood/ui/components/sidebar"
import { navGroups } from "@/lib/nav"

function titleForPath(pathname: string): string {
  for (const group of navGroups) {
    for (const item of group.items) {
      const match =
        item.href === "/"
          ? pathname === "/"
          : pathname === item.href || pathname.startsWith(`${item.href}/`)
      if (match) return item.title
    }
  }
  return "Admin Console"
}

export function AdminHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />
      <h1 className="font-heading text-sm font-medium">
        {titleForPath(pathname)}
      </h1>
    </header>
  )
}
