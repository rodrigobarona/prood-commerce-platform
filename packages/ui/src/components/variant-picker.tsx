"use client"

import type { Maybe, ProductVariant } from "@prood/types"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@prood/ui/components/field"
import { RadioGroup, RadioGroupItem } from "@prood/ui/components/radio-group"
import { localized, type Locale } from "@prood/ui/lib/commerce"

export interface VariantPickerProps {
  variants: ProductVariant[]
  value: Maybe<string>
  onChange: (variantId: string) => void
  locale?: Locale
  className?: string
}

export function VariantPicker({
  variants,
  value,
  onChange,
  locale = "en",
  className,
}: VariantPickerProps) {
  return (
    <RadioGroup
      aria-label="Options"
      value={value ?? ""}
      onValueChange={onChange}
      className={className}
    >
      {variants.map((variant, index) => (
        <FieldLabel key={variant.id} htmlFor={`variant-${variant.id}`}>
          <Field orientation="horizontal" className="rounded-2xl border p-4">
            <RadioGroupItem
              value={variant.id}
              id={`variant-${variant.id}`}
              disabled={!variant.inStock}
            />
            <FieldContent>
              <FieldTitle>
                {localized(variant.name, locale) || variant.sku || `Option ${index + 1}`}
              </FieldTitle>
              {variant.inStock ? null : <FieldDescription>Out of stock</FieldDescription>}
            </FieldContent>
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  )
}
