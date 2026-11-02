"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { PageHeader } from "@prood/ui/components/page-header"
import { authClient } from "@/lib/auth/client"

export function AccessDenied({ email }: { email: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    setLoading(true)
    try {
      const { error } = await authClient.signOut()
      if (error) {
        toast.error("We couldn't sign you out. The request didn't finish. Try again.")
        return
      }
      router.push("/login")
      router.refresh()
    } catch {
      toast.error("We couldn't sign you out. The request didn't finish. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="This account can't open admin"
        description={`${email} doesn't have the admin role. Sign out and use an administrator account, or ask an administrator to give you access.`}
      />
      <Button size="lg" disabled={loading} onClick={handleSignOut}>
        {loading ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  )
}
