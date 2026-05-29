import Link from "next/link"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { getActiveOrganizationId } from "@/lib/auth"
import { listIntegrations, type IntegrationState } from "@/lib/integrations"
import {
  providerRegistry,
  providerTypeLabels,
  type ProviderType,
} from "@/lib/providers"

export const metadata = { title: "Integrations" }

const TYPE_ORDER: ProviderType[] = ["payment", "notification", "analytics"]

export default async function IntegrationsPage() {
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
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-heading text-xl font-medium">Integrations</h2>
        <p className="text-sm text-muted-foreground">
          Connect payment, notification, and analytics providers.
        </p>
      </div>

      {TYPE_ORDER.map((type) => {
        const providers = providerRegistry.filter((p) => p.type === type)
        if (providers.length === 0) return null
        return (
          <section key={type} className="flex flex-col gap-3">
            <h3 className="text-sm font-medium text-muted-foreground">
              {providerTypeLabels[type]}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {providers.map((provider) => {
                const state = configs.get(provider.id)
                const connected = Boolean(state)
                const enabled = state?.enabled ?? false
                return (
                  <Link key={provider.id} href={`/integrations/${provider.id}`}>
                    <Card className="h-full transition-colors hover:ring-foreground/15">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-base">
                            {provider.name}
                          </CardTitle>
                          <Badge
                            variant={
                              enabled
                                ? "secondary"
                                : connected
                                  ? "outline"
                                  : "outline"
                            }
                          >
                            {enabled
                              ? "Enabled"
                              : connected
                                ? "Configured"
                                : "Not connected"}
                          </Badge>
                        </div>
                        <CardDescription>{provider.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
