import { Suspense } from "react"
import type { StoreSettings } from "@prood/commerce"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { SettingsForm } from "@/components/store/settings-form"
import { FormPageSkeleton } from "@/components/skeletons"
import { emptyLocalizedField } from "@/lib/localized-field"
import { getStoreSettings } from "@/lib/admin-api"
import type { SettingsFormValues } from "@/lib/store-settings"

export const metadata = { title: "Store settings" }

function toFormValues(settings: StoreSettings): SettingsFormValues {
  return {
    name: settings.name ?? emptyLocalizedField(),
    description: settings.description ?? emptyLocalizedField(),
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    currency: settings.currency ?? "EUR",
    locale: settings.locale ?? "en",
    timezone: settings.timezone ?? "UTC",
    country: settings.country,
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
  let settings
  try {
    settings = await getStoreSettings()
  } catch (error) {
    if (error instanceof Error && "digest" in error) throw error
    // A blank form would save its empty fields over the real values.
    return (
      <p role="alert" className="text-sm text-destructive">
        We couldn&apos;t load your settings. Refresh the page to try again.
      </p>
    )
  }

  return <SettingsForm initial={toFormValues(settings)} currencyLocked={settings.currencyLocked} />
}
