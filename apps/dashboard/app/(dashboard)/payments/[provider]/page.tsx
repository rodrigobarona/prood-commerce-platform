import { Suspense } from "react"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@prood/ui/components/button"
import { BackLink } from "@prood/ui/components/page-layout"
import { PageHeader } from "@prood/ui/components/page-header"
import { Panel } from "@prood/ui/components/panel"
import { DashboardPage } from "@/components/layout/dashboard-page"
import { ProviderConfigForm } from "@/components/payments/provider-config-form"
import { DetailSkeleton, PageHeaderSkeleton } from "@/components/skeletons"
import { paymentWebhookUrl } from "@prood/commerce"
import { canManageStore } from "@/lib/admin"
import { getActiveOrganizationId } from "@/lib/auth"
import { getIntegration, listIntegrations } from "@/lib/integrations"
import { checkoutRule, getProvider, providerInCharge, providerRegistry } from "@/lib/providers"

export function generateStaticParams() {
  return providerRegistry.map((p) => ({ provider: p.id }))
}

export default function IntegrationConfigPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  return (
    <DashboardPage>
      <Suspense
        fallback={
          <>
            <PageHeaderSkeleton />
            <DetailSkeleton />
          </>
        }
      >
        <IntegrationConfigContent params={params} />
      </Suspense>
    </DashboardPage>
  )
}

async function IntegrationConfigContent({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  await connection()
  const { provider } = await params
  const meta = getProvider(provider)
  if (!meta) notFound()

  // Some providers keep keys in plain text fields, so the form is for admins alone.
  const canManage = await canManageStore()
  const orgId = await getActiveOrganizationId()
  let state = null
  let enabledIds: string[] = []
  if (orgId && canManage) {
    try {
      state = await getIntegration(orgId, provider)
      const integrations = await listIntegrations(orgId)
      enabledIds = [...integrations].filter(([, integration]) => integration.enabled).map(([id]) => id)
    } catch {
      /* DB unavailable */
    }
  }
  const inCharge = providerInCharge(provider, enabledIds)

  const initialValues: Record<string, string> = {}
  const configuredKeys: string[] = []
  for (const field of meta.fields) {
    const value = state?.config[field.key]
    if (value) configuredKeys.push(field.key)
    if (value && field.type !== "password") {
      initialValues[field.key] = value
    }
  }

  return (
    <>
      <PageHeader
        back={<BackLink href="/payments">Payments</BackLink>}
        title={meta.name}
        description={meta.description}
        actions={
          meta.docsUrl ? (
            <Button asChild variant="outline" size="lg">
              <a href={meta.docsUrl} target="_blank" rel="noreferrer">
                <span>Read the {meta.name} docs</span>
                <ArrowSquareOut aria-hidden />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </Button>
          ) : undefined
        }
      />

      {inCharge ? (
        <Panel>
          <p className="text-sm text-pretty">{checkoutRule(meta, inCharge)}</p>
        </Panel>
      ) : null}

      {canManage ? (
        <ProviderConfigForm
          // Only the plain fields: `paymentLabel` is a function and can't reach a client component.
          provider={{ id: meta.id, name: meta.name, fields: meta.fields, webhook: meta.webhook, guide: meta.guide }}
          initialValues={initialValues}
          configuredKeys={configuredKeys}
          initialEnabled={state?.enabled ?? true}
          connected={Boolean(state)}
          webhookUrl={
            orgId ? `${paymentWebhookUrl(meta.id, orgId)}${meta.webhook.query ?? ""}` : null
          }
        />
      ) : (
        <Panel>
          <p className="text-sm text-muted-foreground">
            Only store owners and admins can change {meta.name}. Ask one of them for help.
          </p>
        </Panel>
      )}
    </>
  )
}
