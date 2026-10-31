"use client"

import type { CheckoutAddress, Country } from "@prood/types"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import { localized, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export type AddressInput = Partial<CheckoutAddress>

export interface AddressFormProps {
  value: AddressInput
  onChange: (value: AddressInput) => void
  countries?: Country[]
  idPrefix?: string
  locale?: Locale
  className?: string
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {children}
    </div>
  )
}

export function AddressForm({
  value,
  onChange,
  countries = [],
  idPrefix = "addr",
  locale = "en",
  className,
}: AddressFormProps) {
  const set = (patch: AddressInput) => onChange({ ...value, ...patch })
  const id = (name: string) => `${idPrefix}-${name}`

  return (
    <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2", className)}>
      <Field id={id("firstName")} label="First name" required>
        <Input
          id={id("firstName")}
          value={value.firstName ?? ""}
          onChange={(e) => set({ firstName: e.target.value })}
        />
      </Field>
      <Field id={id("lastName")} label="Last name" required>
        <Input
          id={id("lastName")}
          value={value.lastName ?? ""}
          onChange={(e) => set({ lastName: e.target.value })}
        />
      </Field>
      <Field id={id("phone")} label="Phone">
        <Input
          id={id("phone")}
          value={value.phone ?? ""}
          onChange={(e) => set({ phone: e.target.value })}
        />
      </Field>
      <Field id={id("country")} label="Country" required>
        {countries.length > 0 ? (
          <Select
            value={value.country ?? ""}
            onValueChange={(country) => set({ country })}
          >
            <SelectTrigger id={id("country")}>
              <SelectValue placeholder="Select a country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {localized(c.name, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            id={id("country")}
            value={value.country ?? ""}
            onChange={(e) => set({ country: e.target.value })}
          />
        )}
      </Field>
      <Field id={id("street")} label="Street address" required>
        <Input
          id={id("street")}
          value={value.street ?? ""}
          onChange={(e) => set({ street: e.target.value })}
        />
      </Field>
      <Field id={id("street2")} label="Apartment, suite, etc.">
        <Input
          id={id("street2")}
          value={value.street2 ?? ""}
          onChange={(e) => set({ street2: e.target.value })}
        />
      </Field>
      <Field id={id("city")} label="City" required>
        <Input
          id={id("city")}
          value={value.city ?? ""}
          onChange={(e) => set({ city: e.target.value })}
        />
      </Field>
      <Field id={id("state")} label="State / Region">
        <Input
          id={id("state")}
          value={value.state ?? ""}
          onChange={(e) => set({ state: e.target.value })}
        />
      </Field>
      <Field id={id("postalCode")} label="Postal code">
        <Input
          id={id("postalCode")}
          value={value.postalCode ?? ""}
          onChange={(e) => set({ postalCode: e.target.value })}
        />
      </Field>
    </div>
  )
}
