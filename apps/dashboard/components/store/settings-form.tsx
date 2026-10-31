"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import type { LocalizedField } from "@prood/types"
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@prood/ui/components/card"
import { updateStoreSettingsAction } from "@/app/(dashboard)/settings/actions"
import {
  LocalizedFieldInput,
} from "@/components/store/localized-field-input"

const CURRENCIES = Intl.supportedValuesOf("currency")

export interface SettingsFormValues {
  name: LocalizedField
  description: LocalizedField
  contactEmail: string
  contactPhone: string
  currency: string
  locale: string
  timezone: string
  country: string
  address: string
}

function trimLocalizedField(field: LocalizedField): LocalizedField | undefined {
  const trimmed: LocalizedField = {}
  for (const [key, value] of Object.entries(field)) {
    const next = value.trim()
    if (next) trimmed[key] = next
  }
  return Object.keys(trimmed).length > 0 ? trimmed : undefined
}

export function SettingsForm({
  initial,
  currencyLocked,
}: {
  initial: SettingsFormValues
  currencyLocked: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [values, setValues] = useState<SettingsFormValues>(initial)

  function set<K extends keyof SettingsFormValues>(
    key: K,
    value: SettingsFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    startTransition(async () => {
      try {
        const { error } = await updateStoreSettingsAction({
          name: trimLocalizedField(values.name),
          description: trimLocalizedField(values.description),
          contactEmail: values.contactEmail || undefined,
          contactPhone: values.contactPhone || undefined,
          currency: currencyLocked ? undefined : values.currency || undefined,
          locale: values.locale || undefined,
          timezone: values.timezone || undefined,
          country: values.country || undefined,
          address: values.address || undefined,
        })
        if (error) {
          toast.error(error)
          return
        }
        toast.success("Settings saved")
        router.refresh()
      } catch {
        toast.error("Could not save settings")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Store details</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <LocalizedFieldInput
            label="Store name"
            value={values.name}
            onChange={(name) => set("name", name)}
            required
          />
          <LocalizedFieldInput
            label="Description"
            value={values.description}
            onChange={(description) => set("description", description)}
            multiline
          />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact &amp; localization</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={values.contactEmail}
                onChange={(event) => set("contactEmail", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input
                id="contactPhone"
                value={values.contactPhone}
                onChange={(event) => set("contactPhone", event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              {currencyLocked ? (
                <>
                  <Input
                    id="currency"
                    value={values.currency}
                    readOnly
                    aria-describedby="currency-locked"
                  />
                  <p id="currency-locked" className="text-xs text-muted-foreground">
                    Your store has orders, and they keep the currency they were
                    charged in, so this can&apos;t change.
                  </p>
                </>
              ) : (
                <Select
                  value={values.currency}
                  onValueChange={(currency) => set("currency", currency)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="locale">Locale</Label>
              <Input
                id="locale"
                value={values.locale}
                onChange={(event) => set("locale", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={values.timezone}
                onChange={(event) => set("timezone", event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                maxLength={2}
                value={values.country}
                required
                pattern="[A-Za-z]{2}"
                title="Use a two-letter country code, like PT."
                onChange={(event) => set("country", event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </form>
  )
}
