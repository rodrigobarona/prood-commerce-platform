"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@prood/ui/lib/utils"

export function NavLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: React.ReactNode
}) {
  const active = usePathname() === href

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:underline aria-[current=page]:decoration-brand aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-[6px]",
        className
      )}
    >
      {children}
    </Link>
  )
}
