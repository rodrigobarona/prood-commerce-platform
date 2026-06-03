import { Suspense } from "react"
import type { StoreSettings } from "@prood/commerce"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import {
  SettingsForm,
  type SettingsFormValues,
} from "@/components/store/settings-form"
import { FormPageSkeleton } from "@/components/skeletons"
import { emptyLocalizedField } from "@/lib/localized-field"
import { getStoreSettings } from "@/lib/admin-api"

export const metadata = { title: "Store settings" }

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

export default function SettingsPage() {
  return (
    <DashboardFormPage>
      <div>
        <h2 className="font-heading text-xl font-medium">Store settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure your store details and preferences.
        </p>
      </div>
      <Suspense fallback={<FormPageSkeleton />}>
        <SettingsFormLoader />
      </Suspense>
    </DashboardFormPage>
  )
}

async function SettingsFormLoader() {
  let initial = EMPTY
  try {
    const settings = await getStoreSettings()
    initial = toFormValues(settings)
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
  }

  return <SettingsForm initial={initial} />
}
