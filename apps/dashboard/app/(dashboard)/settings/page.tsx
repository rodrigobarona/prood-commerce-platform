import { Suspense } from "react"
import Link from "next/link"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr"
import type { StoreSettings } from "@prood/commerce"
import { Button } from "@prood/ui/components/button"
import { CopyBlock } from "@prood/ui/components/copy-block"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { SettingsForm } from "@/components/store/settings-form"
import { StoreData } from "@/components/store/store-data"
import { FormPageSkeleton } from "@/components/skeletons"
import { fieldText } from "@/lib/localized-field"
import { isStoreOwnerRole } from "@prood/auth/membership"
import { getStoreSettings } from "@/lib/admin-api"
import { getActiveMemberRole, getActiveOrganizationId } from "@/lib/auth"
import { shippingNote } from "@/lib/shipping"
import { getStoreUrl } from "@/lib/store-link"
import type { SettingsFormValues } from "@/lib/store-settings"

export const metadata = { title: "Store settings" }

function toFormValues(settings: StoreSettings): SettingsFormValues {
  return {
    name: fieldText(settings.name),
    description: fieldText(settings.description),
    contactEmail: settings.contactEmail ?? "",
    contactPhone: settings.contactPhone ?? "",
    currency: settings.currency ?? "EUR",
    timezone: settings.timezone ?? "UTC",
    country: settings.country,
    address: settings.address ?? "",
  }
}

export default function SettingsPage() {
  return (
    <DashboardFormPage>
      <PageHeader title="Store settings" description="What customers see about your store, and where it's based." />
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
      <Panel>
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t load your settings. Refresh the page to try again.
        </p>
      </Panel>
    )
  }

  const storeUrl = await getStoreUrl().catch(() => null)
  const [storeId, role] = await Promise.all([getActiveOrganizationId(), getActiveMemberRole()])

  return (
    <>
      {storeUrl ? (
        <Panel
          title="Store address"
          description="Where customers find your store. It can't be changed."
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link href="/domains">Manage domains</Link>
            </Button>
          }
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <CopyBlock value={storeUrl} label="store address" className="min-w-0 flex-1" />
            <Button asChild variant="outline" size="lg">
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <span>Open store</span>
                <ArrowSquareOut aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          </div>
        </Panel>
      ) : null}
      <Panel title="Shipping" description="What customers pay at checkout.">
        <p className="text-sm text-pretty">{shippingNote(settings.currency ?? "EUR")}</p>
      </Panel>
      <SettingsForm
        initial={toFormValues(settings)}
        source={{ name: settings.name, description: settings.description }}
        currencyLocked={settings.currencyLocked}
      />
      {storeId ? (
        <StoreData storeId={storeId} storeName={fieldText(settings.name)} canDelete={isStoreOwnerRole(role)} />
      ) : null}
    </>
  )
}
