"use client"

import { useRef, useState, useTransition } from "react"
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
  const [invalid, setInvalid] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        const result = await addDomainAction(domain)
        if ("invalid" in result) {
          setInvalid(result.invalid)
          inputRef.current?.focus()
          return
        }
        if ("limit" in result) {
          toast.error(result.limit)
          return
        }
        toast.success("Domain added. Add the DNS records below to connect it.")
        setDomain("")
        router.refresh()
      } catch {
        toast.error("We couldn't add this domain. Nothing changed. Check the address and try again.")
      }
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <div className="flex flex-1 flex-col gap-1.5">
        <Label htmlFor="domain">Custom domain</Label>
        <Input
          id="domain"
          ref={inputRef}
          required
          placeholder="loja.casalume.example"
          aria-invalid={invalid ? true : undefined}
          aria-describedby={invalid ? "domain-error" : undefined}
          value={domain}
          onChange={(event) => {
            setInvalid(null)
            setDomain(event.target.value)
          }}
        />
        {invalid ? (
          <p id="domain-error" className="text-xs text-destructive">
            {invalid}
          </p>
        ) : null}
      </div>
      <Button type="submit" size="lg" className="sm:mt-5.5" disabled={pending}>
        {pending ? "Adding..." : "Add domain"}
      </Button>
    </form>
  )
}
