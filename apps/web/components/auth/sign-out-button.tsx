"use client"

import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { signOut } from "@/lib/auth/client"

export function SignOutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut()
        router.push("/")
        router.refresh()
      }}
    >
      Sign out
    </Button>
  )
}
