import type { UpdateStoreInput } from "@prood/commerce"
import type { LocalizedField } from "@prood/types"

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

/**
 * An empty contact email or description is the merchant removing it, so it
 * goes as `null`: `undefined` would leave the old value on the store.
 */
export function toStoreUpdate(values: SettingsFormValues): UpdateStoreInput {
  return {
    name: trimLocalizedField(values.name),
    description: trimLocalizedField(values.description) ?? null,
    contactEmail: values.contactEmail.trim() || null,
    contactPhone: values.contactPhone || undefined,
    currency: values.currency || undefined,
    locale: values.locale || undefined,
    timezone: values.timezone || undefined,
    country: values.country || undefined,
    address: values.address || undefined,
  }
}
