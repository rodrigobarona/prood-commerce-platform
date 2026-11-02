"use client"

import { useId } from "react"
import { RadioGroup as RadioGroupPrimitive } from "radix-ui"
import type { Maybe, ProductVariant } from "@prood/types"
import { localized, type Locale } from "@prood/ui/lib/commerce"
import { cn } from "@prood/ui/lib/utils"

export interface VariantPickerProps {
  variants: ProductVariant[]
  value: Maybe<string>
  onChange: (variantId: string) => void
  /** What the variants differ by, such as "Size". */
  label?: string
  locale?: Locale
  className?: string
}

export function VariantPicker({
  variants,
  value,
  onChange,
  label = "Options",
  locale = "en",
  className,
}: VariantPickerProps) {
  const labelId = useId()

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <span id={labelId} className="text-sm">
        {label}
      </span>
      <RadioGroupPrimitive.Root
        aria-labelledby={labelId}
        value={value ?? ""}
        onValueChange={onChange}
        className="flex flex-wrap gap-2"
      >
        {variants.map((variant, index) => {
          const name = localized(variant.name, locale) || variant.sku || `Option ${index + 1}`
          return (
            <RadioGroupPrimitive.Item
              key={variant.id}
              value={variant.id}
              disabled={!variant.inStock}
              aria-label={variant.inStock ? name : `${name}, out of stock`}
              className="border-input hover:border-foreground data-[state=checked]:border-foreground data-[state=checked]:bg-foreground data-[state=checked]:text-background focus-visible:ring-ring focus-visible:ring-offset-background disabled:text-muted-foreground disabled:hover:border-input h-11 min-w-14 rounded-lg border px-4 text-sm transition-colors duration-100 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:line-through"
            >
              {name}
            </RadioGroupPrimitive.Item>
          )
        })}
      </RadioGroupPrimitive.Root>
    </div>
  )
}
