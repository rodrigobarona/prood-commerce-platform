"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { authClient } from "@/lib/auth/client"

export function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(initial.name)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        const { error } = await authClient.updateUser({ name: name.trim() })
        if (error) {
          toast.error(error.message ?? "We couldn't save your profile. Nothing changed. Try again.")
          return
        }
        toast.success("Profile saved.")
        router.refresh()
      } catch {
        toast.error("We couldn't save your profile. Nothing changed. Try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <Panel
        title="Personal details"
        description="Your name shows in the sidebar and on team lists."
        footer={
          <Button type="submit" disabled={pending || name.trim() === initial.name}>
            {pending ? "Saving..." : "Save profile"}
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={initial.email}
              readOnly
              disabled
              aria-describedby="profile-email-hint"
              className="bg-muted"
            />
            <p id="profile-email-hint" className="text-xs text-muted-foreground">
              Your email is how you sign in, and it can&apos;t be changed here yet.
            </p>
          </div>
        </div>
      </Panel>
    </form>
  )
}
