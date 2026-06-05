"use client"

import { useCallback, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { iso31661 } from "iso-3166"
import { Button } from "@prood/ui/components/button"
import { Checkbox } from "@prood/ui/components/checkbox"
import { Input } from "@prood/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@prood/ui/components/select"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@prood/ui/components/field"
import {
  AddressAutocomplete,
  type ParsedAddress,
} from "../address-autocomplete"
import { getPhonePlaceholder, countryUsesStates } from "@/lib/geo"
import { addressSchema, type AddressValues } from "../schemas"

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? ""

const countries = iso31661.map((c) => ({
  value: c.alpha2,
  label: c.name,
}))

interface AddressStepProps {
  defaultValues?: Partial<AddressValues>
  geoCountry?: string
  onSubmit: (values: AddressValues & { useSameForBilling: boolean }) => void
  onBack: () => void
}

export function AddressStep({
  defaultValues,
  geoCountry,
  onSubmit,
  onBack,
}: AddressStepProps) {
  const [useSameForBilling, setUseSameForBilling] = useState(true)
  const [showStreet2, setShowStreet2] = useState(!!defaultValues?.street2)

  const initialCountry = defaultValues?.country || geoCountry || ""

  const form = useForm<AddressValues>({
    resolver: zodResolver(addressSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      street: "",
      street2: "",
      city: "",
      state: "",
      postalCode: "",
      country: initialCountry,
      phone: "",
      ...defaultValues,
    },
  })

  const selectedCountry = form.watch("country")
  const showState = countryUsesStates(selectedCountry)
  const phonePlaceholder = getPhonePlaceholder(selectedCountry || geoCountry || "")

  const handleAutocompleteSelect = useCallback(
    (parsed: ParsedAddress) => {
      form.setValue("street", parsed.street, { shouldValidate: true })
      if (parsed.street2) {
        form.setValue("street2", parsed.street2, { shouldValidate: true })
        setShowStreet2(true)
      }
      form.setValue("city", parsed.city, { shouldValidate: true })
      form.setValue("state", parsed.state, { shouldValidate: true })
      form.setValue("postalCode", parsed.postalCode, { shouldValidate: true })
      if (parsed.country) {
        form.setValue("country", parsed.country, { shouldValidate: true })
      }
    },
    [form],
  )

  function handleSubmit(values: AddressValues) {
    onSubmit({ ...values, useSameForBilling })
  }

  return (
    <form
      onSubmit={form.handleSubmit(handleSubmit)}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Controller
          name="firstName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>First name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="shipping given-name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        <Controller
          name="lastName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="shipping family-name"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Phone <span className="text-muted-foreground font-normal">(for delivery updates)</span>
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="tel"
              inputMode="tel"
              autoComplete="shipping tel"
              aria-invalid={fieldState.invalid}
              placeholder={phonePlaceholder}
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Controller
        name="country"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Country / Region</FieldLabel>
            <input
              type="hidden"
              name="country"
              value={field.value}
              autoComplete="shipping country"
            />
            <Select
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id={field.name}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {GEOAPIFY_KEY ? (
        <Field>
          <FieldLabel htmlFor="address-search">Search address</FieldLabel>
          <AddressAutocomplete
            id="address-search"
            apiKey={GEOAPIFY_KEY}
            countryFilter={selectedCountry || undefined}
            onSelect={handleAutocompleteSelect}
            placeholder="Start typing to find your address…"
          />
        </Field>
      ) : null}

      <Controller
        name="street"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Street address</FieldLabel>
            <Input
              {...field}
              id={field.name}
              autoComplete="shipping address-line1"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      {showStreet2 ? (
        <Controller
          name="street2"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                Apartment, suite, etc.
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="shipping address-line2"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      ) : (
        <button
          type="button"
          className="w-fit text-sm text-primary hover:underline"
          onClick={() => setShowStreet2(true)}
        >
          + Add apartment, suite, etc.
        </button>
      )}

      <div className={showState ? "grid grid-cols-1 gap-4 sm:grid-cols-3" : "grid grid-cols-1 gap-4 sm:grid-cols-2"}>
        <Controller
          name="city"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>City</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="shipping address-level2"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />

        {showState ? (
          <Controller
            name="state"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  State / Province
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  autoComplete="shipping address-level1"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : null}

        <Controller
          name="postalCode"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Postal code</FieldLabel>
              <Input
                {...field}
                id={field.name}
                autoComplete="shipping postal-code"
                inputMode="text"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} />
              )}
            </Field>
          )}
        />
      </div>

      <Field orientation="horizontal" className="mt-1">
        <Checkbox
          id="useSameForBilling"
          checked={useSameForBilling}
          onCheckedChange={(v) => setUseSameForBilling(v === true)}
        />
        <FieldLabel htmlFor="useSameForBilling" className="font-normal">
          Use same address for billing
        </FieldLabel>
      </Field>

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue to shipping method
        </Button>
      </div>
    </form>
  )
}
