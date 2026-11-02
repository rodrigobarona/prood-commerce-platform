import type { UpdateStoreInput } from "@prood/commerce"
import type { LocalizedField, Maybe } from "@prood/types"
import { withFieldText } from "@/lib/localized-field"

export interface SettingsFormValues {
  name: string
  description: string
  contactEmail: string
  contactPhone: string
  currency: string
  timezone: string
  country: string
  address: string
}

/** What's stored for these fields today, so saving keeps what the form doesn't show. */
export interface SettingsSource {
  name?: Maybe<LocalizedField>
  description?: Maybe<LocalizedField>
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** The API's rule too: digits with the usual separators, and enough of them to dial. */
const PHONE = /^\+?[\d\s().-]+$/
const MIN_PHONE_DIGITS = 6

export type ContactErrors = Partial<Record<"name" | "contactEmail" | "contactPhone", string>>

export function contactErrors(
  values: Pick<SettingsFormValues, "contactEmail" | "contactPhone"> & { name?: string }
): ContactErrors {
  const errors: ContactErrors = {}
  if (values.name !== undefined && !values.name.trim()) {
    errors.name = "Your store needs a name. Customers see it on every page."
  }
  const email = values.contactEmail.trim()
  if (email && !EMAIL.test(email)) {
    errors.contactEmail = "We can't use that email. It looks incomplete. Enter the whole address, like ola@casalume.example."
  }
  const phone = values.contactPhone.trim()
  if (phone && (!PHONE.test(phone) || phone.replace(/\D/g, "").length < MIN_PHONE_DIGITS)) {
    errors.contactPhone = "We can't use that phone number. It should only have digits. Enter it like +351 912 345 678."
  }
  return errors
}

/**
 * An empty contact email, phone or description is the merchant removing it, so
 * it goes as `null`: `undefined` would leave the old value on the store.
 */
export function toStoreUpdate(values: SettingsFormValues, source: SettingsSource = {}): Omit<UpdateStoreInput, "locale"> {
  return {
    name: withFieldText(source.name, values.name),
    description: withFieldText(source.description, values.description) ?? null,
    contactEmail: values.contactEmail.trim() || null,
    contactPhone: values.contactPhone.trim() || null,
    currency: values.currency || undefined,
    timezone: values.timezone || undefined,
    country: values.country || undefined,
    address: values.address || undefined,
  }
}
