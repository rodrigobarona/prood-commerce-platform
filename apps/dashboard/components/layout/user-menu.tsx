"use client"

import Link from "next/link"
import { User } from "@phosphor-icons/react"
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
    </UserMenu>
  )
}
