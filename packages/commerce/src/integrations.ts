import 'server-only'
import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import { decryptConfig } from './crypto'

// The integration_config table is owned by the auth schema and is not
// RLS-protected; every query below filters by organization_id explicitly.
let sql: NeonQueryFunction<false, false> | null = null

function db(): NeonQueryFunction<false, false> {
  if (sql) return sql
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is required')
  sql = neon(url)
  return sql
}

/** Payment gateways a store can connect, in checkout preference order. */
export const PAYMENT_PROVIDER_IDS = ['stripe', 'easypay', 'ifthenpay'] as const
export type PaymentProviderId = (typeof PAYMENT_PROVIDER_IDS)[number]

export function isPaymentProviderId(id: string): id is PaymentProviderId {
  return (PAYMENT_PROVIDER_IDS as readonly string[]).includes(id)
}

/** A store's decrypted credentials for one enabled provider, or null. */
export async function getTenantIntegrationConfig(
  organizationId: string,
  provider: string,
): Promise<Record<string, string> | null> {
  const rows = (await db()`
    SELECT config FROM integration_config
    WHERE organization_id = ${organizationId}
      AND provider = ${provider}
      AND enabled = true
    LIMIT 1
  `) as { config: Record<string, string> | null }[]
  const row = rows[0]
  return row ? decryptConfig(row.config ?? {}) : null
}

/** Payment providers the store has connected and enabled, in preference order. */
export async function listTenantPaymentProviders(
  organizationId: string,
): Promise<PaymentProviderId[]> {
  const rows = (await db()`
    SELECT provider FROM integration_config
    WHERE organization_id = ${organizationId}
      AND enabled = true
      AND provider = ANY(${[...PAYMENT_PROVIDER_IDS]})
  `) as { provider: string }[]
  const connected = new Set(rows.map((r) => r.provider))
  return PAYMENT_PROVIDER_IDS.filter((id) => connected.has(id))
}
