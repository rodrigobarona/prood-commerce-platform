"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import { assertTeamSeatAvailableAction } from "@/app/(dashboard)/team/actions"
import { authClient } from "@/lib/auth/client"

export function InviteMemberForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        const limit = await assertTeamSeatAvailableAction()
        if (limit.error) {
          toast.error(limit.error)
          return
        }
        const { error } = await authClient.organization.inviteMember({
          email,
          role: role as "member" | "admin" | "owner",
        })
        if (error) {
          toast.error(error.message ?? "We couldn't send this invitation. Check the email address and try again.")
          return
        }
        toast.success(`Invitation sent to ${email}.`)
        setEmail("")
        router.refresh()
      } catch {
        toast.error("We couldn't send this invitation. Nothing changed. Try again.")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          required
          placeholder="ines@casalume.example"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="invite-role">Role</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger id="invite-role" className="w-full data-[size=default]:h-9 sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending..." : "Send invitation"}
      </Button>
    </form>
  )
}
