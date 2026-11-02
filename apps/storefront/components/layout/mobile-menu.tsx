"use client"

import { useState } from "react"
import Link from "next/link"
import { ListIcon } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@prood/ui/components/sheet"

export interface NavLink {
  href: string
  label: string
}

export function MobileMenu({ links, storeName }: { links: NavLink[]; storeName: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="-ml-2.5 size-10 lg:hidden [&_svg:not([class*='size-'])]:size-5"
          aria-label="Open menu"
        >
          <ListIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader className="h-[4.5rem] justify-center border-b px-5 py-0">
          <SheetTitle className="font-heading text-xl font-normal tracking-tight">
            {storeName || "Menu"}
          </SheetTitle>
        </SheetHeader>
        <nav aria-label="Main" className="flex flex-1 flex-col px-5 py-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="border-b py-3.5 text-base last:border-b-0"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t px-5 py-4">
          <Link href="/account" onClick={() => setOpen(false)} className="text-sm">
            Your account
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
