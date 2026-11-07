import { Suspense } from "react"
import Link from "next/link"
import { CaretRight } from "@phosphor-icons/react/dist/ssr"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { IntegrationsSkeleton } from "@/components/skeletons"
import { Status } from "@prood/ui/components/status-badge"
import { getActiveOrganizationId } from "@/lib/auth"
import { listIntegrations, type IntegrationState } from "@/lib/integrations"
import {
  providerRegistry,
  providerTypeLabels,
  type ProviderType,
} from "@/lib/providers"
import { integrationStatus } from "@/lib/status"

export const metadata = { title: "Payments" }

const TYPE_ORDER: ProviderType[] = ["payment", "notification", "analytics"]

export default function IntegrationsPage() {
  return (
    <DashboardPage>
      <PageHeader
        title="Payments"
        description="Connect your own payment accounts. Payouts go straight from the provider to you, and Prood takes no cut."
      />

      <Suspense fallback={<IntegrationsSkeleton />}>
        <IntegrationsList />
      </Suspense>
    </DashboardPage>
  )
}

async function IntegrationsList() {
  const orgId = await getActiveOrganizationId()
  let configs = new Map<string, IntegrationState>()
  if (orgId) {
    try {
      configs = await listIntegrations(orgId)
    } catch {
      /* DB unavailable */
    }
  }

  return (
    <>
      {TYPE_ORDER.map((type) => {
        const providers = providerRegistry.filter((p) => p.type === type)
        if (providers.length === 0) return null
        return (
          <Panel
            key={type}
            title={providerTypeLabels[type]}
            description={
              type === "payment"
                ? "Each store's checkout runs on one provider, and Stripe comes first if it's connected. Need Multibanco or MB WAY? Use Easypay or Ifthenpay."
                : undefined
            }
            flush
          >
            <ul className="divide-y divide-border">
              {providers.map((provider) => (
                <li key={provider.id}>
                  <Link
                    href={`/payments/${provider.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors duration-120 hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium">{provider.name}</span>
                      <span className="text-sm text-pretty text-muted-foreground">{provider.description}</span>
                    </div>
                    <Status look={integrationStatus(configs.get(provider.id))} />
                    <CaretRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        )
      })}
    </>
  )
}
