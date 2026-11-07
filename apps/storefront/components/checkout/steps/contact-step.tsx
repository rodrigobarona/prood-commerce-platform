"use client"

import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CommerceButton } from "@prood/ui/components/commerce-button"
import { Input } from "@prood/ui/components/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@prood/ui/components/field"
import { getPhonePlaceholder } from "@/lib/geo"
import { contactSchema, type ContactValues } from "../schemas"

interface ContactStepProps {
  defaultValues?: Partial<ContactValues>
  geoCountry?: string
  /** Hears every change, so it can be saved before the step is finished. */
  onChange?: (values: Partial<ContactValues>) => void
  onSubmit: (values: ContactValues) => void
}

export function ContactStep({ defaultValues, geoCountry, onChange, onSubmit }: ContactStepProps) {
  const phonePlaceholder = getPhonePlaceholder(geoCountry ?? "")

  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      phone: "",
      ...defaultValues,
    },
  })

  useEffect(
    () => form.subscribe({ formState: { values: true }, callback: ({ values }) => onChange?.(values) }),
    [form, onChange],
  )

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Email address</FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="email"
              inputMode="email"
              autoComplete="shipping email"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? "email-error email-hint" : "email-hint"}
              placeholder="ana@casalume.example"
            />
            <FieldDescription id="email-hint">
              We&apos;ll send your order confirmation here. If you&apos;re signed in, it goes to your account email.
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Phone <span className="text-muted-foreground font-normal">(optional)</span>
            </FieldLabel>
            <Input
              {...field}
              id={field.name}
              type="tel"
              autoComplete="shipping tel"
              inputMode="tel"
              aria-invalid={fieldState.invalid}
              aria-describedby={fieldState.invalid ? "phone-error phone-hint" : "phone-hint"}
              placeholder={phonePlaceholder}
            />
            <FieldDescription id="phone-hint">For delivery updates</FieldDescription>
            {fieldState.invalid && (
              <FieldError id={`${field.name}-error`} errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <CommerceButton type="submit" className="mt-2">
        Continue to address
      </CommerceButton>
    </form>
  )
}
