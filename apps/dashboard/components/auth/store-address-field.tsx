"use client"

import { useEffect, useState } from "react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@prood/ui/components/input-group"
import { Label } from "@prood/ui/components/label"
import { checkStoreAddressAction, type AddressAvailability } from "@/app/(auth)/actions"
import { STORE_HOST_SUFFIX, cleanAddress, storeHost } from "@/lib/create-store"

const CHECK_DELAY_MS = 300

/** What will really happen to this address, in words, while there's time to change it. */
function addressHint(address: string, availability: AddressAvailability | null): string {
  if (!address) return "Where customers find your store. You can't change it later."
  if (availability === "taken") return "That address is taken. Pick another, or we'll add a few characters to the end."
  if (availability === "reserved") return "That address is kept for Prood. Pick another, or we'll add a few characters to the end."
  if (availability === "available") return `Your store will be at ${storeHost(address)}. You can't change it later.`
  return "Checking that address..."
}

/** Where customers will find the store. It follows the store's name until someone edits it. */
export function StoreAddressField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [checked, setChecked] = useState<{ address: string; availability: AddressAvailability } | null>(null)
  const address = value.replace(/-+$/, "")

  useEffect(() => {
    if (!address) return
    let current = true
    const timer = setTimeout(() => {
      checkStoreAddressAction(address)
        .then((availability) => {
          if (current) setChecked({ address, availability })
        })
        .catch(() => undefined)
    }, CHECK_DELAY_MS)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [address])

  const availability = checked?.address === address ? checked.availability : null

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="storeAddress">Store address</Label>
      <InputGroup className="h-9">
        <InputGroupInput
          id="storeAddress"
          required
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={availability === "taken" || availability === "reserved" ? true : undefined}
          aria-describedby="storeAddress-hint"
          value={value}
          onChange={(event) => onChange(cleanAddress(event.target.value))}
        />
        <InputGroupAddon align="inline-end">{STORE_HOST_SUFFIX}</InputGroupAddon>
      </InputGroup>
      <p id="storeAddress-hint" role="status" className="text-xs text-pretty text-muted-foreground">
        {addressHint(address, availability)}
      </p>
    </div>
  )
}

/** Agencies arrive here from "Start a client store" on the marketing site. */
export function ClientStoreHint({ id }: { id: string }) {
  return (
    <p id={id} className="text-xs text-pretty text-muted-foreground">
      Running several client stores?{" "}
      <a href="mailto:hello@prood.com" className="text-foreground underline underline-offset-4">
        Email us
      </a>
      .
    </p>
  )
}
