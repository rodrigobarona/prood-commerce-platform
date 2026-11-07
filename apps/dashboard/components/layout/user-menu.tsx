"use client"

import Link from "next/link"
import { House, User } from "@phosphor-icons/react"
import { DropdownMenuItem } from "@prood/ui/components/dropdown-menu"
import { UserMenu, type UserSummary } from "@prood/ui/components/user-menu"
import { authClient } from "@/lib/auth/client"

export function DashboardUserMenu({ user }: { user: UserSummary }) {
  return (
    <UserMenu user={user} signOut={() => authClient.signOut()}>
      <DropdownMenuItem asChild>
        <Link href="/account">
          <User className="size-4" />
          <span>Profile</span>
        </Link>
      </DropdownMenuItem>
      {/* The marketing site is another app on prood.com, so a plain link: `/` is this dashboard while you are signed in. */}
      <DropdownMenuItem asChild>
        <a href="/home">
          <House className="size-4" />
          <span>Homepage</span>
        </a>
      </DropdownMenuItem>
    </UserMenu>
  )
}
