import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr"
import { ProviderConfigForm } from "@/components/integrations/provider-config-form"
import { getActiveOrganizationId } from "@/lib/auth"
import { getIntegration } from "@/lib/integrations"
import { getProvider } from "@/lib/providers"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
  const { provider } = await params
  const meta = getProvider(provider)
  return { title: meta ? meta.name : "Integration" }
}

export default async function IntegrationConfigPage({
  params,
}: {
  params: Promise<{ provider: string }>
}) {
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

  // Never send stored secrets to the client. Text fields are pre-filled; secret
  // fields are blank and shown as "saved" via configuredKeys.
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
    <div className="flex flex-col gap-6">
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
    </div>
  )
}
