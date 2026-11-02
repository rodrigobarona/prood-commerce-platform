"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Panel } from "@prood/ui/components/panel"
import { SaveBar, useFocusReturn, useUnsavedChangesGuard } from "@prood/ui/components/save-bar"
import { SearchSelect } from "@prood/ui/components/search-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import { Textarea } from "@prood/ui/components/textarea"
import { countryOptions, timezoneOptions } from "@prood/ui/lib/region-options"
import { updateStoreSettingsAction } from "@/app/(dashboard)/settings/actions"
import {
  contactErrors,
  toStoreUpdate,
  type ContactErrors,
  type SettingsFormValues,
  type SettingsSource,
} from "@/lib/store-settings"

const CURRENCIES = Intl.supportedValuesOf("currency")
const TIMEZONES = timezoneOptions()
const COUNTRIES = countryOptions()

const PUBLIC_FIELD_HINT = "Shown on your store and to customers."

export function SettingsForm({
  initial,
  source,
  currencyLocked,
}: {
  initial: SettingsFormValues
  source?: SettingsSource
  currencyLocked: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // A value saved before these fields were validated shows as a choice to make.
  const [saved, setSaved] = useState<SettingsFormValues>(() => ({
    ...initial,
    timezone: TIMEZONES.some((zone) => zone.value === initial.timezone) ? initial.timezone : "",
    country: COUNTRIES.some((country) => country.value === initial.country) ? initial.country : "",
  }))
  const [values, setValues] = useState(saved)
  const [showRegionErrors, setShowRegionErrors] = useState(false)
  const [errors, setErrors] = useState<ContactErrors>({})
  const { trackFocus, returnFocus } = useFocusReturn()

  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  useUnsavedChangesGuard(dirty)

  function set<K extends keyof SettingsFormValues>(
    key: K,
    value: SettingsFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (key in prev ? { ...prev, [key]: undefined } : prev))
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const found = contactErrors(values)
    setErrors(found)
    setShowRegionErrors(!values.timezone || !values.country)
    const firstInvalid = found.name ? "store-name" : found.contactEmail ? "contactEmail" : found.contactPhone ? "contactPhone" : null
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus()
      return
    }
    if (!values.timezone || !values.country) return
    startTransition(async () => {
      try {
        const { error } = await updateStoreSettingsAction({
          ...toStoreUpdate(values, source),
          currency: currencyLocked ? undefined : values.currency || undefined,
        })
        if (error) {
          toast.error(error)
          return
        }
        setSaved(values)
        returnFocus()
        toast.success("Settings saved.")
        router.refresh()
      } catch {
        toast.error("We couldn't save your settings. Nothing changed. Try again.")
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} onFocusCapture={trackFocus} noValidate className="flex w-full flex-col gap-6">
      <Panel title="Store details">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-name">Store name</Label>
            <Input
              id="store-name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errors.name ? "store-name-error" : undefined}
              value={values.name}
              onChange={(event) => set("name", event.target.value)}
            />
            {errors.name ? (
              <p id="store-name-error" className="text-xs text-destructive">
                {errors.name}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="store-description">Description</Label>
            <Textarea
              id="store-description"
              rows={4}
              aria-describedby="store-description-hint"
              value={values.description}
              onChange={(event) => set("description", event.target.value)}
            />
            <p id="store-description-hint" className="text-xs text-muted-foreground">
              {PUBLIC_FIELD_HINT}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Business address</Label>
            <Input
              id="address"
              autoComplete="street-address"
              value={values.address}
              onChange={(event) => set("address", event.target.value)}
            />
          </div>
        </div>
      </Panel>

      <Panel title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              type="email"
              aria-invalid={errors.contactEmail ? true : undefined}
              aria-describedby={errors.contactEmail ? "contactEmail-error contactEmail-hint" : "contactEmail-hint"}
              value={values.contactEmail}
              onChange={(event) => set("contactEmail", event.target.value)}
            />
            {errors.contactEmail ? (
              <p id="contactEmail-error" className="text-xs text-destructive">
                {errors.contactEmail}
              </p>
            ) : null}
            <p id="contactEmail-hint" className="text-xs text-muted-foreground">
              {PUBLIC_FIELD_HINT}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input
              id="contactPhone"
              type="tel"
              aria-invalid={errors.contactPhone ? true : undefined}
              aria-describedby={errors.contactPhone ? "contactPhone-error" : undefined}
              value={values.contactPhone}
              onChange={(event) => set("contactPhone", event.target.value)}
            />
            {errors.contactPhone ? (
              <p id="contactPhone-error" className="text-xs text-destructive">
                {errors.contactPhone}
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel title="Region" description="Your store's currency, and the country and timezone you run it from.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">Currency</Label>
            {currencyLocked ? (
              <>
                <Input
                  id="currency"
                  value={values.currency}
                  readOnly
                  disabled
                  aria-describedby="currency-locked"
                  className="bg-muted"
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
                <SelectTrigger id="currency" className="w-full data-[size=default]:h-9">
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
            <Label htmlFor="timezone">Timezone</Label>
            <SearchSelect
              id="timezone"
              value={values.timezone}
              options={TIMEZONES}
              onValueChange={(next) => set("timezone", next)}
              placeholder="Choose a timezone"
              searchLabel="Search timezones"
              emptyText="No timezone by that name."
              invalid={showRegionErrors && !values.timezone}
              describedBy={showRegionErrors && !values.timezone ? "timezone-error" : undefined}
            />
            {showRegionErrors && !values.timezone ? (
              <p id="timezone-error" className="text-xs text-destructive">
                Choose your store&apos;s timezone.
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="country">Country</Label>
            <SearchSelect
              id="country"
              value={values.country}
              options={COUNTRIES}
              onValueChange={(next) => set("country", next)}
              placeholder="Choose a country"
              searchLabel="Search countries"
              emptyText="No country by that name."
              invalid={showRegionErrors && !values.country}
              describedBy={showRegionErrors && !values.country ? "country-error" : undefined}
            />
            {showRegionErrors && !values.country ? (
              <p id="country-error" className="text-xs text-destructive">
                Choose the country your store sells from.
              </p>
            ) : null}
          </div>
        </div>
      </Panel>

      <SaveBar
        visible={dirty}
        pending={pending}
        saveLabel="Save settings"
        onDiscard={() => {
          setValues(saved)
          setErrors({})
          returnFocus()
        }}
      />
    </form>
  )
}
