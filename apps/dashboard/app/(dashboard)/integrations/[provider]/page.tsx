import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import { DashboardFormPage } from "@/components/layout/dashboard-page"
import { ProviderConfigForm } from "@/components/integrations/provider-config-form"
import { FormPageSkeleton } from "@/components/skeletons"
import { getActiveOrganizationId } from "@/lib/auth"
import { getIntegration } from "@/lib/integrations"
import { getProvider, providerRegistry } from "@/lib/providers"

export function generateStaticParams() {
  return providerRegistry.map((p) => ({ provider: p.id }))
}

export default function IntegrationConfigPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  return (
    <DashboardFormPage>
      <Suspense fallback={<FormPageSkeleton />}>
        <IntegrationConfigContent params={params} />
      </Suspense>
    </DashboardFormPage>
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

  const orgId = await getActiveOrganizationId()
  let state = null
  if (orgId) {
    try {
      state = await getIntegration(orgId, provider)
    } catch {
      /* DB unavailable */
    }
  }

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
      <div className="flex flex-col gap-2">
        <Link
          href="/integrations"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Integrations
        </Link>
        <div>
          <h2 className="font-heading text-xl font-medium">{meta.name}</h2>
          <p className="text-sm text-muted-foreground">{meta.description}</p>
          {meta.docsUrl ? (
            <a
              href={meta.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-foreground hover:underline"
            >
              View documentation
            </a>
          ) : null}
        </div>
      </div>

      <ProviderConfigForm
        provider={meta}
        initialValues={initialValues}
        configuredKeys={configuredKeys}
        initialEnabled={state?.enabled ?? false}
        connected={Boolean(state)}
      />
    </>
  )
}
