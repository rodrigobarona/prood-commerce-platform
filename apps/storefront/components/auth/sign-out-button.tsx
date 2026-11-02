"use client"

import { useRouter } from "next/navigation"
import { Button } from "@prood/ui/components/button"
import { signOut } from "@/lib/auth/client"
import { clearDraft } from "@/lib/checkout-draft"

export function SignOutButton() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await signOut()
        // A shared computer's next shopper shouldn't find this one's address in the form.
        clearDraft()
        router.push("/")
        router.refresh()
      }}
    >
      Sign out
    </Button>
  )
}
