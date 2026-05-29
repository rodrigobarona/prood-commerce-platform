import 'server-only'
import { neon } from '@neondatabase/serverless'

// The integration_config table is owned by the dashboard (auth schema) and is
// not RLS-protected, so a plain read is correct here. A placeholder keeps
// module evaluation safe during build without DATABASE_URL.
const sql = neon(
  process.env.DATABASE_URL ??
    'postgresql://placeholder:placeholder@localhost:5432/placeholder',
)

export interface TenantIntegration {
  enabled: boolean
  config: Record<string, string>
}

/**
 * Load an organization's enabled credentials for a provider, or null when the
 * provider isn't configured/enabled for that tenant. Used by the provider
 * factories to bind a merchant's own Stripe/EasyPay/etc. account.
 */
export async function getTenantIntegration(
  organizationId: string,
  provider: string,
): Promise<TenantIntegration | null> {
  try {
    const rows = (await sql`
      SELECT enabled, config FROM integration_config
      WHERE organization_id = ${organizationId}
        AND provider = ${provider}
        AND enabled = true
      LIMIT 1
    `) as { enabled: boolean; config: Record<string, string> | null }[]
    const row = rows[0]
    if (!row) return null
    return { enabled: row.enabled, config: row.config ?? {} }
  } catch {
    return null
  }
}

/** A provider's tenant credentials as a flat config object (empty if none). */
export async function getTenantPaymentConfig(
  organizationId: string,
  provider: string,
): Promise<Record<string, string>> {
  const integration = await getTenantIntegration(organizationId, provider)
  return integration?.config ?? {}
}
