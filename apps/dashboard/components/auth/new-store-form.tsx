"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@prood/ui/components/button"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { PageHeader } from "@prood/ui/components/page-header"
import { ClientStoreHint, StoreAddressField } from "@/components/auth/store-address-field"
import { authClient } from "@/lib/auth/client"
import { storeNameError } from "@/lib/auth/sign-up-errors"
import { addressFromName, createStore } from "@/lib/create-store"

export function NewStoreForm({ hasStores }: { hasStores: boolean }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [address, setAddress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setNameError(storeNameError)
      document.getElementById("storeName")?.focus()
      return
    }
    setLoading(true)
    setError(null)

    const result = await createStore(name, address ?? addressFromName(name))
    if ("error" in result) {
      setLoading(false)
      setError(result.error)
      return
    }

    toast.success(`Your store is at ${result.host}.`)
    router.push("/")
    router.refresh()
  }

  async function signOut() {
    try {
      await authClient.signOut()
      router.push("/login")
      router.refresh()
    } catch {
      toast.error("We couldn't sign you out. The request didn't finish. Try again.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={hasStores ? "Add a store" : "Create your store"}
        description={
          hasStores
            ? "It gets its own products, orders and payment accounts. Your other stores stay as they are."
            : "You're not part of a store yet. Name yours to get started."
        }
      />
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="storeName">Store name</Label>
          <Input
            id="storeName"
            required
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? "storeName-error" : "storeName-hint"}
            value={name}
            onChange={(event) => {
              setNameError(null)
              setName(event.target.value)
            }}
          />
          {nameError ? (
            <p id="storeName-error" className="text-xs text-destructive">
              {nameError}
            </p>
          ) : null}
          <ClientStoreHint id="storeName-hint" />
        </div>
        <StoreAddressField value={address ?? addressFromName(name)} onChange={setAddress} />
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" variant="brand" disabled={loading}>
          {loading ? "Creating your store..." : "Create store"}
        </Button>
        {hasStores ? (
          <Button asChild size="lg" variant="ghost">
            <Link href="/">Back to your store</Link>
          </Button>
        ) : (
          <Button type="button" size="lg" variant="ghost" onClick={signOut}>
            Use a different account
          </Button>
        )}
      </form>
    </div>
  )
}
