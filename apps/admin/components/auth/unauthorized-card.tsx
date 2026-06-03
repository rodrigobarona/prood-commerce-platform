"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldSlash } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { authClient } from "@/lib/auth/client"

export function UnauthorizedCard() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-destructive text-destructive-foreground">
          <ShieldSlash className="size-6" weight="bold" />
        </div>
        <CardTitle className="text-xl">Access Denied</CardTitle>
        <CardDescription>
          Your account does not have administrator privileges.
          Please sign in with an admin account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          className="w-full"
          disabled={loading}
          onClick={handleSignOut}
        >
          {loading ? "Signing out..." : "Sign out and try again"}
        </Button>
      </CardContent>
    </Card>
  )
}
