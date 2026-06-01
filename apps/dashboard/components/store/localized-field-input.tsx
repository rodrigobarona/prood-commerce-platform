"use client"

import type { LocalizedField } from "@prood/types"
import { DEFAULT_LOCALES, LOCALE_META } from "@prood/types"
import { Input } from "@prood/ui/components/input"
import { Label } from "@prood/ui/components/label"
import { Textarea } from "@prood/ui/components/textarea"

export function emptyLocalizedField(): LocalizedField {
  return { en: "", pt: "", es: "" }
}

export function LocalizedFieldInput({
  label,
  value,
  onChange,
  multiline = false,
  required = false,
}: {
  label: string
  value: LocalizedField
  onChange: (value: LocalizedField) => void
  multiline?: boolean
  required?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <Label>{label}</Label>
      {DEFAULT_LOCALES.map((locale) => {
        const fieldId = `${label.toLowerCase().replace(/\s+/g, "-")}-${locale}`
        const localeLabel = LOCALE_META[locale]?.name ?? locale.toUpperCase()
        const commonProps = {
          id: fieldId,
          value: value[locale] ?? "",
          onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            onChange({ ...value, [locale]: event.target.value }),
          required: required && locale === "en",
        }

        return (
          <div key={locale} className="flex flex-col gap-1.5">
            <Label htmlFor={fieldId} className="text-xs text-muted-foreground">
              {localeLabel}
            </Label>
            {multiline ? (
              <Textarea {...commonProps} rows={3} />
            ) : (
              <Input {...commonProps} />
            )}
          </div>
        )
      })}
    </div>
  )
}
