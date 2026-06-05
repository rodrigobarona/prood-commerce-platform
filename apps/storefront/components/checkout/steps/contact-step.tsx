"use client"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@prood/ui/components/button"
import { Checkbox } from "@prood/ui/components/checkbox"
import { Input } from "@prood/ui/components/input"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@prood/ui/components/field"
import { contactSchema, type ContactValues } from "../schemas"

interface ContactStepProps {
  defaultValues?: Partial<ContactValues>
  onSubmit: (values: ContactValues) => void
}

export function ContactStep({ defaultValues, onSubmit }: ContactStepProps) {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      phone: "",
      marketingOptIn: false,
      ...defaultValues,
    },
  })

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
              autoComplete="email"
              aria-invalid={fieldState.invalid}
              placeholder="you@example.com"
            />
            <FieldDescription>
              We&apos;ll send your order confirmation here
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
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
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={fieldState.invalid}
              placeholder="+1 (555) 000-0000"
            />
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </Field>
        )}
      />

      <Controller
        name="marketingOptIn"
        control={form.control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FieldLabel htmlFor={field.name} className="font-normal">
              Email me with news and offers
            </FieldLabel>
          </Field>
        )}
      />

      <Button type="submit" className="mt-2">
        Continue to shipping
      </Button>
    </form>
  )
}
