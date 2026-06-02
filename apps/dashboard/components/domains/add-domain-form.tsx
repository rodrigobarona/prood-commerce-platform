"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { addDomainAction } from "@/app/(dashboard)/domains/actions"

export function AddDomainForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [domain, setDomain] = useState("")

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        await addDomainAction(domain)
        toast.success("Domain added — configure the DNS records below")
        setDomain("")
        router.refresh()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not add domain")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 sm:flex-row sm:items-end"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="domain">Custom domain</Label>
        <Input
          id="domain"
          required
          placeholder="shop.yourbrand.com"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add domain"}
      </Button>
    </form>
  )
}
