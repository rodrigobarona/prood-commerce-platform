"use client"

import { UserMenu, type UserSummary } from "@prood/ui/components/user-menu"
import { authClient } from "@/lib/auth/client"

export function AdminUserMenu({ user }: { user: UserSummary }) {
  return <UserMenu user={user} signOut={() => authClient.signOut()} />
}
