import type { StoreSettings } from "@prood/commerce"
import {
  SettingsForm,
  type SettingsFormValues,
} from "@/components/store/settings-form"
import { emptyLocalizedField } from "@/components/store/localized-field-input"
import { getStoreSettings } from "@/lib/admin-api"

export const metadata = { title: "Settings" }

const EMPTY: SettingsFormValues = {
  name: emptyLocalizedField(),
  description: emptyLocalizedField(),
  contactEmail: "",
  contactPhone: "",
  currency: "EUR",
  locale: "en",
  timezone: "UTC",
  address: "",
}

function toFormValues(settings: StoreSettings): SettingsFormValues {
  return {
    name: settings.name ?? emptyLocalizedField(),
    description: settings.description ?? emptyLocalizedField(),
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    currency: settings.currency ?? "EUR",
    locale: settings.locale ?? "en",
    timezone: settings.timezone ?? "UTC",
    address: settings.address ?? "",
  }
}

export default async function SettingsPage() {
  let initial = EMPTY
  try {
    const settings = await getStoreSettings()
    initial = toFormValues(settings)
  } catch {
    /* DB unavailable — render empty form */
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-xl font-medium">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your store details and preferences.
        </p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  )
}
