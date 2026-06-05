"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { SpinnerGapIcon, TruckIcon } from "@phosphor-icons/react"
import { Button } from "@prood/ui/components/button"
import { RadioGroup, RadioGroupItem } from "@prood/ui/components/radio-group"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
  FieldTitle,
  FieldDescription,
} from "@prood/ui/components/field"
import type { Locale } from "@prood/ui/lib/commerce"
import { shippingMethodSchema, type ShippingMethodValues } from "../schemas"

interface ShippingMethodPrice {
  amount: number
  currency: string
  formatted?: string
}

interface ShippingMethod {
  id: string
  name: string
  description?: string
  price?: ShippingMethodPrice
  estimatedDays?: string
}

interface ShippingStepProps {
  cartId: string
  locale?: Locale
  defaultValues?: Partial<ShippingMethodValues>
  onSubmit: (values: ShippingMethodValues) => void
  onBack: () => void
}

export function ShippingStep({
  cartId,
  locale = "en",
  defaultValues,
  onSubmit,
  onBack,
}: ShippingStepProps) {
  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const form = useForm<ShippingMethodValues>({
    resolver: zodResolver(shippingMethodSchema),
    mode: "onTouched",
    defaultValues: { methodId: defaultValues?.methodId ?? "" },
  })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/commerce/cart/shipping-methods`)
        if (!res.ok) throw new Error("Failed to load shipping methods")
        const data = (await res.json()) as { methods: ShippingMethod[] }
        setMethods(data.methods ?? [])
        const first = data.methods?.[0]
        if (data.methods?.length === 1 && !defaultValues?.methodId && first) {
          form.setValue("methodId", first.id)
        }
      } catch {
        setFetchError("Could not load shipping options. Please try again.")
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [cartId, defaultValues?.methodId, form])

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <SpinnerGapIcon className="size-5 animate-spin" />
        <span className="text-sm">Loading shipping options...</span>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-destructive">{fetchError}</p>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed py-8 text-center text-muted-foreground">
          <TruckIcon className="size-8" />
          <p className="text-sm">
            No shipping methods available for this address.
          </p>
        </div>
        <Button type="button" variant="ghost" onClick={onBack}>
          Back to address
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-4"
    >
      <Controller
        name="methodId"
        control={form.control}
        render={({ field, fieldState }) => (
          <>
            <RadioGroup
              name={field.name}
              value={field.value}
              onValueChange={field.onChange}
              className="flex flex-col gap-3"
            >
              {methods.map((method) => (
                <FieldLabel key={method.id} htmlFor={`shipping-${method.id}`}>
                  <Field
                    orientation="horizontal"
                    data-invalid={fieldState.invalid}
                    className="rounded-2xl border p-4"
                  >
                    <RadioGroupItem
                      value={method.id}
                      id={`shipping-${method.id}`}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldContent>
                      <FieldTitle>{method.name}</FieldTitle>
                      {method.description ? (
                        <FieldDescription>
                          {method.description}
                        </FieldDescription>
                      ) : null}
                      {method.estimatedDays ? (
                        <FieldDescription>
                          Estimated delivery: {method.estimatedDays}
                        </FieldDescription>
                      ) : null}
                    </FieldContent>
                    {method.price ? (
                      <span className="shrink-0 text-sm font-medium">
                        {method.price.amount === 0
                          ? "Free"
                          : method.price.formatted ?? `${method.price.currency} ${(method.price.amount / 100).toFixed(2)}`}
                      </span>
                    ) : null}
                  </Field>
                </FieldLabel>
              ))}
            </RadioGroup>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} />
            )}
          </>
        )}
      />

      <div className="mt-2 flex gap-3">
        <Button type="button" variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" className="flex-1">
          Continue to payment
        </Button>
      </div>
    </form>
  )
}
